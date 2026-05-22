// lib/queueStorage.ts
// LocalStorage-backed queue for product posting

export type QueueStatus = "pending" | "scheduled" | "processing" | "sent" | "failed" | "paused";

export type QueueItem<T = unknown> = {
  id: string;
  data: T;
  createdAt: number;
  scheduledAt?: number;
  manualScheduledAt?: number;
  status?: QueueStatus;
  priority?: number;
};

const QUEUE_KEY = "telegram_post_queue_v1";
const QUEUE_SETTINGS_KEY = "telegram_queue_settings_v1";

export type QueueScheduleSettings = {
  minIntervalMinutes: number;
  maxIntervalMinutes: number;
  activeStart: string; // HH:mm
  activeEnd: string; // HH:mm
};

const DEFAULT_SETTINGS: QueueScheduleSettings = {
  minIntervalMinutes: 5,
  maxIntervalMinutes: 7,
  activeStart: "08:00",
  activeEnd: "22:00",
};

const parseTimeToMinutes = (value: string): number => {
  const [rawHours, rawMinutes] = value.split(":");
  const hours = Number.parseInt(rawHours || "0", 10);
  const minutes = Number.parseInt(rawMinutes || "0", 10);
  return Math.max(0, Math.min(23, hours)) * 60 + Math.max(0, Math.min(59, minutes));
};

const withTime = (base: Date, minutesOfDay: number): Date => {
  const next = new Date(base);
  next.setHours(0, 0, 0, 0);
  next.setMinutes(minutesOfDay);
  return next;
};

const isSameSlot = (left: number, right: number, windowMs = 60 * 1000): boolean => {
  return Math.abs(left - right) < windowMs;
};

const normalizeToActiveWindow = (timestamp: number, settings: QueueScheduleSettings): number => {
  const date = new Date(timestamp);
  const activeStartMinutes = parseTimeToMinutes(settings.activeStart);
  const activeEndMinutes = parseTimeToMinutes(settings.activeEnd);
  const start = withTime(date, activeStartMinutes);
  const end = withTime(date, activeEndMinutes);

  if (date < start) {
    return start.getTime();
  }

  if (date > end) {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    return withTime(nextDay, activeStartMinutes).getTime();
  }

  return timestamp;
};

const getRandomIntervalMs = (settings: QueueScheduleSettings): number => {
  const min = Math.max(1, Math.floor(settings.minIntervalMinutes));
  const max = Math.max(min, Math.floor(settings.maxIntervalMinutes));
  const span = max - min + 1;
  const value = min + Math.floor(Math.random() * span);
  return value * 60 * 1000;
};

const scheduleAutoSlot = (
  queue: QueueItem[],
  settings: QueueScheduleSettings,
  now: number
): number => {
  const manualSlots = queue
    .map((item) => item.manualScheduledAt ?? item.scheduledAt)
    .filter((value): value is number => typeof value === "number");
  const autoSlots = queue
    .filter((item) => !item.manualScheduledAt)
    .map((item) => item.scheduledAt ?? item.createdAt)
    .filter((value): value is number => typeof value === "number");
  const lastAuto = autoSlots.length > 0 ? Math.max(...autoSlots) : 0;
  let candidate = Math.max(now, lastAuto) + getRandomIntervalMs(settings);
  candidate = normalizeToActiveWindow(candidate, settings);

  for (let attempts = 0; attempts < 200; attempts += 1) {
    const hasConflict = manualSlots.some((slot) => isSameSlot(slot, candidate)) ||
      autoSlots.some((slot) => isSameSlot(slot, candidate));

    if (!hasConflict) {
      return candidate;
    }

    candidate = normalizeToActiveWindow(candidate + getRandomIntervalMs(settings), settings);
  }

  return candidate;
};

export function getQueueSettings(): QueueScheduleSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const raw = localStorage.getItem(QUEUE_SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as QueueScheduleSettings) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function setQueueSettings(settings: QueueScheduleSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_SETTINGS_KEY, JSON.stringify(settings));
}

export function getQueue<T = unknown>(): QueueItem<T>[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueueItem<T>[]) : [];
  } catch {
    return [];
  }
}

export function setQueue<T = unknown>(queue: QueueItem<T>[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueue<T = unknown>(item: Omit<QueueItem<T>, "createdAt">) {
  const queue = getQueue<T>();
  const settings = getQueueSettings();
  const now = Date.now();
  const manualScheduledAt = item.manualScheduledAt;
  const scheduledAt =
    typeof manualScheduledAt === "number"
      ? manualScheduledAt
      : typeof item.scheduledAt === "number"
        ? item.scheduledAt
        : scheduleAutoSlot(queue as QueueItem[], settings, now);

  if (!queue.some((queuedItem) => queuedItem.id === item.id)) {
    queue.push({
      ...item,
      createdAt: now,
      manualScheduledAt,
      scheduledAt,
      status: item.status ?? "scheduled",
    });
    setQueue(queue);
  }
}

export function enqueueMany<T = unknown>(items: Array<Omit<QueueItem<T>, "createdAt">>) {
  const queue = getQueue<T>();
  const knownIds = new Set(queue.map((queuedItem) => queuedItem.id));
  const settings = getQueueSettings();
  const now = Date.now();

  for (const item of items) {
    if (!knownIds.has(item.id)) {
      const manualScheduledAt = item.manualScheduledAt;
      const scheduledAt =
        typeof manualScheduledAt === "number"
          ? manualScheduledAt
          : typeof item.scheduledAt === "number"
            ? item.scheduledAt
            : scheduleAutoSlot(queue as QueueItem[], settings, now);

      queue.push({
        ...item,
        createdAt: now,
        manualScheduledAt,
        scheduledAt,
        status: item.status ?? "scheduled",
      });
      knownIds.add(item.id);
    }
  }

  setQueue(queue);
}

export function dequeue<T = unknown>(): QueueItem<T> | undefined {
  const queue = getQueue<T>();
  const item = queue.shift();
  setQueue(queue);
  return item;
}

export function removeFromQueue(id: string) {
  const queue = getQueue();
  setQueue(queue.filter((item) => item.id !== id));
}

export function clearQueue() {
  setQueue([]);
}

export function isQueued(id: string): boolean {
  return getQueue().some((queuedItem) => queuedItem.id === id);
}
