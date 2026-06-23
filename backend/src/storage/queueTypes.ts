export type QueueStatus = "pending" | "scheduled" | "processing" | "sent" | "failed" | "paused";

export type QueueItem<T = unknown> = {
  id: string;
  idempotencyKey?: string;
  data: T;
  createdAt: number;
  scheduledAt?: number;
  manualScheduledAt?: number;
  status?: QueueStatus;
  priority?: number;
  caption?: string;
  target?: string;
  successfulChannels?: string;
  retryCount?: number;
  maxRetries?: number;
  lastError?: string;
  processingStartedAt?: number;
};

export type DeadLetterItem<T = unknown> = {
  id: string;
  originalQueueId?: string;
  data: T;
  caption?: string;
  target?: string;
  error?: string;
  retryCount?: number;
  createdAt: number;
  movedAt: number;
};

export type QueueScheduleSettings = {
  minIntervalMinutes: number;
  maxIntervalMinutes: number;
};

export type QueueStats = {
  total: number;
  pending: number;
  processing: number;
  failed: number;
  sent: number;
  deadLetter: number;
  nextScheduledAt: number | null;
  lastError: string | null;
};
