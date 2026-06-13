export type QueueStatus = "pending" | "scheduled" | "processing" | "sent" | "failed" | "paused";

export type QueueItem<T = unknown> = {
  id: string;
  data: T;
  createdAt: number;
  scheduledAt?: number;
  manualScheduledAt?: number;
  status?: QueueStatus;
  priority?: number;
  caption?: string;
  target?: string;
};

export type BackendQueueItem<T = unknown> = {
  id: string;
  idempotencyKey?: string;
  data: T;
  caption?: string;
  target?: string;
  status: QueueStatus;
  priority: number;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  scheduledAt?: number;
  manualScheduledAt?: number;
  createdAt: number;
  processingStartedAt?: number;
};

export type BackendDeadLetterItem<T = unknown> = {
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

export type BackendQueueStats = {
  total: number;
  pending: number;
  processing: number;
  failed: number;
  sent: number;
  deadLetter: number;
  nextScheduledAt: number | null;
  lastError: string | null;
};

export type BackendQueueScheduleSettings = {
  minIntervalMinutes: number;
  maxIntervalMinutes: number;
  activeStart: string;
  activeEnd: string;
};

export type BackendHealth = {
  status: string;
  uptime: number;
  whatsapp: {
    connection: string;
  };
  queue: BackendQueueStats;
  timestamp: number;
};

export type QueueScheduleSettings = {
  minIntervalMinutes: number;
  maxIntervalMinutes: number;
  activeStart: string;
  activeEnd: string;
};
