// lib/queueStorage.ts
// LocalStorage-backed queue for product posting

export type QueueItem<T = unknown> = {
  id: string;
  data: T;
  createdAt: number;
};

const QUEUE_KEY = "telegram_post_queue_v1";

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

  if (!queue.some((queuedItem) => queuedItem.id === item.id)) {
    queue.push({ ...item, createdAt: Date.now() });
    setQueue(queue);
  }
}

export function enqueueMany<T = unknown>(items: Array<Omit<QueueItem<T>, "createdAt">>) {
  const queue = getQueue<T>();
  const knownIds = new Set(queue.map((queuedItem) => queuedItem.id));

  for (const item of items) {
    if (!knownIds.has(item.id)) {
      queue.push({ ...item, createdAt: Date.now() });
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
