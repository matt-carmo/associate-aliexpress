import { getDb } from "./database.js";
import type {
  QueueItem,
  QueueScheduleSettings,
  QueueStats,
  DeadLetterItem,
} from "./queueTypes.js";

export type { QueueItem, QueueScheduleSettings, QueueStats, DeadLetterItem } from "./queueTypes.js";
export type { QueueStatus } from "./queueTypes.js";

const DEFAULT_SETTINGS: QueueScheduleSettings = {
  minIntervalMinutes: 5,
  maxIntervalMinutes: 7,
};

export function getQueueSettings(): QueueScheduleSettings {
  const db = getDb();
  const rows = db
    .prepare("SELECT key, value FROM settings")
    .all() as { key: string; value: string }[];

  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }

  return {
    minIntervalMinutes: Number(map.min_interval_minutes) ?? DEFAULT_SETTINGS.minIntervalMinutes,
    maxIntervalMinutes: Number(map.max_interval_minutes) ?? DEFAULT_SETTINGS.maxIntervalMinutes,
  };
}

export function setQueueSettings(settings: Partial<QueueScheduleSettings>) {
  const db = getDb();
  const upsert = db.prepare(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)"
  );

  const tx = db.transaction(() => {
    if (settings.minIntervalMinutes !== undefined) {
      upsert.run("min_interval_minutes", String(settings.minIntervalMinutes));
    }
    if (settings.maxIntervalMinutes !== undefined) {
      upsert.run("max_interval_minutes", String(settings.maxIntervalMinutes));
    }

  });

  tx();
}

export function getQueue<T = unknown>(): QueueItem<T>[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM queue ORDER BY priority DESC, scheduled_at ASC, created_at ASC"
    )
    .all() as Record<string, unknown>[];

  return rows.map(rowToQueueItem<T>);
}

export function getQueueByStatus<T = unknown>(
  status: string
): QueueItem<T>[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM queue WHERE status = ? ORDER BY priority DESC, scheduled_at ASC, created_at ASC"
    )
    .all(status) as Record<string, unknown>[];

  return rows.map(rowToQueueItem<T>);
}

export function getQueueItem<T = unknown>(
  id: string
): QueueItem<T> | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM queue WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;

  if (!row) return undefined;
  return rowToQueueItem<T>(row);
}

function rowToQueueItem<T>(row: Record<string, unknown>): QueueItem<T> {
  return {
    id: row.id as string,
    idempotencyKey: (row.idempotency_key as string) ?? undefined,
    data: JSON.parse(row.data as string) as T,
    caption: (row.caption as string) ?? undefined,
    target: (row.target as string) ?? undefined,
    successfulChannels: (row.successful_channels as string) ?? undefined,
    status: (row.status as QueueItem["status"]) ?? "pending",
    priority: (row.priority as number) ?? 0,
    retryCount: (row.retry_count as number) ?? 0,
    maxRetries: (row.max_retries as number) ?? 3,
    lastError: (row.last_error as string) ?? undefined,
    scheduledAt: (row.scheduled_at as number) ?? undefined,
    manualScheduledAt: (row.manual_scheduled_at as number) ?? undefined,
    createdAt: row.created_at as number,
    processingStartedAt: (row.processing_started_at as number) ?? undefined,
  };
}

export function enqueue<T = unknown>(
  item: Omit<
    QueueItem<T>,
    "createdAt" | "idempotencyKey"
  > & { idempotencyKey?: string }
) {
  const db = getDb();
  const now = Date.now();
  const settings = getQueueSettings();
  const scheduledAt = resolveSchedule(item, settings, now);

  const existing = db
    .prepare("SELECT id FROM queue WHERE id = ?")
    .get(item.id) as { id: string } | undefined;

  if (existing) return;

  const idempotencyKey =
    item.idempotencyKey ?? `${item.id}-${now}`;

  db.prepare(
    `INSERT INTO queue (id, idempotency_key, data, caption, target, status, priority, retry_count, max_retries, scheduled_at, manual_scheduled_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    item.id,
    idempotencyKey,
    JSON.stringify(item.data),
    item.caption ?? null,
    item.target ?? null,
    item.status ?? "scheduled",
    item.priority ?? 0,
    0,
    item.maxRetries ?? 3,
    scheduledAt,
    item.manualScheduledAt ?? null,
    now,
    now
  );
}

export function enqueueMany<T = unknown>(
  items: Array<
    Omit<QueueItem<T>, "createdAt" | "idempotencyKey"> & {
      idempotencyKey?: string;
    }
  >
) {
  const db = getDb();
  const settings = getQueueSettings();
  const now = Date.now();

  const insert = db.prepare(
    `INSERT OR IGNORE INTO queue (id, idempotency_key, data, caption, target, status, priority, retry_count, max_retries, scheduled_at, manual_scheduled_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const existingIds = new Set(
    db
      .prepare("SELECT id FROM queue")
      .all()
      .map((r: unknown) => (r as { id: string }).id)
  );

  const tx = db.transaction(() => {
    for (const item of items) {
      if (existingIds.has(item.id)) continue;

      const scheduledAt = resolveSchedule(
        item as Parameters<typeof resolveSchedule>[0],
        settings,
        now
      );
      const idempotencyKey =
        item.idempotencyKey ?? `${item.id}-${now}`;

      insert.run(
        item.id,
        idempotencyKey,
        JSON.stringify(item.data),
        item.caption ?? null,
        item.target ?? null,
        item.status ?? "scheduled",
        item.priority ?? 0,
        0,
        item.maxRetries ?? 3,
        scheduledAt,
        item.manualScheduledAt ?? null,
        now,
        now
      );

      existingIds.add(item.id);
    }
  });

  tx();
}

export function claimNextItem(): QueueItem | undefined {
  const db = getDb();

  const tx = db.transaction(() => {
    const row = db
      .prepare(
        `SELECT * FROM queue
         WHERE scheduled_at <= ? AND (status = 'pending' OR status = 'failed' OR status = 'scheduled')
         ORDER BY priority DESC, scheduled_at ASC, created_at ASC
         LIMIT 1`
      )
      .get(Date.now()) as Record<string, unknown> | undefined;

    if (!row) return undefined;

    db.prepare(
      "UPDATE queue SET status = 'processing', processing_started_at = ?, updated_at = ? WHERE id = ?"
    ).run(Date.now(), Date.now(), row.id);

    return rowToQueueItem(row);
  });

  return tx();
}

export function markAsSent(id: string) {
  const db = getDb();
  db.prepare(
    "DELETE FROM queue WHERE id = ?"
  ).run(id);
}

export function markAsFailed(id: string, error: string) {
  const db = getDb();
  const item = db.prepare("SELECT * FROM queue WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;

  if (!item) return;

  const retryCount = ((item.retry_count as number) ?? 0) + 1;
  const maxRetries = (item.max_retries as number) ?? 3;

  if (retryCount >= maxRetries) {
    moveToDeadLetter(id, error);
    return;
  }

  const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);

  db.prepare(
    `UPDATE queue
     SET status = 'failed', retry_count = ?, last_error = ?, scheduled_at = ?, updated_at = ?, processing_started_at = NULL
     WHERE id = ?`
  ).run(retryCount, error, Date.now() + delay, Date.now(), id);
}

export function moveToDeadLetter(id: string, error: string) {
  const db = getDb();
  const item = db.prepare("SELECT * FROM queue WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;

  if (!item) return;

  db.prepare(
    `INSERT INTO dead_letter_queue (id, original_queue_id, data, caption, target, error, retry_count, created_at, moved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    `${item.id}_${Date.now()}`,
    item.id,
    item.data,
    item.caption,
    item.target ?? null,
    error,
    item.retry_count,
    item.created_at,
    Date.now()
  );

  db.prepare("DELETE FROM queue WHERE id = ?").run(id);
}

export function removeFromQueue(id: string) {
  const db = getDb();
  db.prepare("DELETE FROM queue WHERE id = ?").run(id);
}

export function updateQueueItem(
  id: string,
  updates: Partial<QueueItem>
) {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.status !== undefined) {
    fields.push("status = ?");
    values.push(updates.status);
  }
  if (updates.priority !== undefined) {
    fields.push("priority = ?");
    values.push(updates.priority);
  }
  if (updates.caption !== undefined) {
    fields.push("caption = ?");
    values.push(updates.caption);
  }
  if (updates.target !== undefined) {
    fields.push("target = ?");
    values.push(updates.target);
  }
  if (updates.successfulChannels !== undefined) {
    fields.push("successful_channels = ?");
    values.push(updates.successfulChannels);
  }
  if (updates.manualScheduledAt !== undefined) {
    fields.push("manual_scheduled_at = ?");
    values.push(updates.manualScheduledAt);
    fields.push("scheduled_at = ?");
    values.push(updates.manualScheduledAt);
  }
  if (updates.retryCount !== undefined) {
    fields.push("retry_count = ?");
    values.push(updates.retryCount);
  }
  if (updates.maxRetries !== undefined) {
    fields.push("max_retries = ?");
    values.push(updates.maxRetries);
  }

  if (fields.length === 0) return;

  fields.push("updated_at = ?");
  values.push(Date.now());
  values.push(id);

  db.prepare(
    `UPDATE queue SET ${fields.join(", ")} WHERE id = ?`
  ).run(...values);
}

export function clearQueue() {
  const db = getDb();
  db.prepare("DELETE FROM queue").run();
}

export function isQueued(id: string): boolean {
  const db = getDb();
  const row = db.prepare("SELECT id FROM queue WHERE id = ?").get(id);
  return row !== undefined;
}

export function getDeadLetterQueue<T = unknown>(): DeadLetterItem<T>[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM dead_letter_queue ORDER BY moved_at DESC"
    )
    .all() as Record<string, unknown>[];

  return rows.map((row) => ({
    id: row.id as string,
    originalQueueId: (row.original_queue_id as string) ?? undefined,
    data: JSON.parse(row.data as string) as T,
    caption: (row.caption as string) ?? undefined,
    target: (row.target as string) ?? undefined,
    error: (row.error as string) ?? undefined,
    retryCount: (row.retry_count as number) ?? undefined,
    createdAt: row.created_at as number,
    movedAt: row.moved_at as number,
  }));
}

export function reprocessDeadLetter(id: string) {
  const db = getDb();
  const dlqItem = db
    .prepare("SELECT * FROM dead_letter_queue WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;

  if (!dlqItem) return false;

  const insert = db.prepare(
    `INSERT OR IGNORE INTO queue (id, idempotency_key, data, caption, target, status, priority, retry_count, max_retries, scheduled_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'pending', 0, 0, 3, ?, ?, ?)`
  );

  const deleteDlq = db.prepare("DELETE FROM dead_letter_queue WHERE id = ?");

  const tx = db.transaction(() => {
    insert.run(
      dlqItem.original_queue_id ?? dlqItem.id,
      `reprocess-${dlqItem.id}`,
      dlqItem.data,
      dlqItem.caption,
      dlqItem.target ?? null,
      Date.now(),
      Date.now(),
      Date.now()
    );
    deleteDlq.run(id);
  });

  tx();
  return true;
}

export function purgeDeadLetterQueue() {
  const db = getDb();
  db.prepare("DELETE FROM dead_letter_queue").run();
}

export function getQueueStats(): QueueStats {
  const db = getDb();

  const counts = db
    .prepare(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
         SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
         SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
         SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused
       FROM queue`
    )
    .get() as Record<string, number>;

  const dlqCount = (
    db
      .prepare("SELECT COUNT(*) as count FROM dead_letter_queue")
      .get() as { count: number }
  ).count;

  const nextItem = db
    .prepare(
      "SELECT scheduled_at FROM queue WHERE status IN ('pending', 'scheduled') ORDER BY scheduled_at ASC LIMIT 1"
    )
    .get() as { scheduled_at: number } | undefined;

  const lastError = db
    .prepare(
      "SELECT last_error FROM queue WHERE status = 'failed' ORDER BY updated_at DESC LIMIT 1"
    )
    .get() as { last_error: string } | undefined;

  return {
    total: counts.total,
    pending: counts.pending + counts.scheduled,
    processing: counts.processing,
    failed: counts.failed,
    sent: 0,
    deadLetter: dlqCount,
    nextScheduledAt: nextItem?.scheduled_at ?? null,
    lastError: lastError?.last_error ?? null,
  };
}

export function cleanupOrphanedProcessing() {
  const db = getDb();
  const staleThreshold = Date.now() - 5 * 60 * 1000;

  db.prepare(
    `UPDATE queue
     SET status = 'pending', processing_started_at = NULL, updated_at = ?
     WHERE status = 'processing' AND processing_started_at < ?`
  ).run(Date.now(), staleThreshold);
}

function isSameSlot(
  left: number,
  right: number,
  windowMs = 60 * 1000
): boolean {
  return Math.abs(left - right) < windowMs;
}

function getRandomIntervalMs(settings: QueueScheduleSettings): number {
  const min = Math.max(1, Math.floor(settings.minIntervalMinutes));
  const max = Math.max(min, Math.floor(settings.maxIntervalMinutes));
  const span = max - min + 1;
  const value = min + Math.floor(Math.random() * span);
  return value * 60 * 1000;
}

function resolveSchedule(
  item: { manualScheduledAt?: number; scheduledAt?: number; status?: string },
  settings: QueueScheduleSettings,
  now: number
): number {
  if (typeof item.manualScheduledAt === "number") {
    return item.manualScheduledAt;
  }

  if (typeof item.scheduledAt === "number") {
    return item.scheduledAt;
  }

  if (item.status === "pending") {
    return now;
  }

  const db = getDb();
  const queue = db
    .prepare("SELECT * FROM queue")
    .all() as Record<string, unknown>[];

  const manualSlots = queue
    .map((q) => q.manual_scheduled_at)
    .filter((v): v is number => typeof v === "number");
  const autoSlots = queue
    .filter((q) => !q.manual_scheduled_at)
    .map((q) => q.scheduled_at ?? q.created_at)
    .filter((v): v is number => typeof v === "number");

  const lastAuto = autoSlots.length > 0 ? Math.max(...autoSlots) : 0;
  let candidate = Math.max(now, lastAuto) + getRandomIntervalMs(settings);

  for (let attempts = 0; attempts < 200; attempts += 1) {
    const hasConflict =
      manualSlots.some((slot) => isSameSlot(slot, candidate)) ||
      autoSlots.some((slot) => isSameSlot(slot, candidate));
    if (!hasConflict) return candidate;
    candidate = candidate + getRandomIntervalMs(settings);
  }

  return candidate;
}
