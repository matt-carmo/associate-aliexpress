import type { BackendQueueItem, BackendQueueStats, BackendDeadLetterItem, BackendHealth, BackendQueueScheduleSettings } from "./queueTypes";

const API_URL = process.env.NEXT_PUBLIC_MESSAGING_API_URL ?? "http://localhost:4000";

console.log("Using API URL:", API_URL);

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Backend error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function enqueueItem(item: {
  id: string;
  idempotencyKey?: string;
  data: unknown;
  caption?: string;
  target?: string;
  manualScheduledAt?: number;
  status?: string;
  priority?: number;
  maxRetries?: number;
}) {
  return request<{ message: string }>("/queue", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function getQueue() {
  return request<{
    queue: BackendQueueItem[];
    settings: BackendQueueScheduleSettings;
    stats: BackendQueueStats;
  }>("/queue");
}

export async function removeQueueItem(id: string) {
  return request<{ message: string }>(`/queue/${id}`, {
    method: "DELETE",
  });
}

export async function updateQueueItem(
  id: string,
  updates: { manualScheduledAt?: number; caption?: string; target?: string; priority?: number }
) {
  return request<{ message: string }>(`/queue/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function getQueueStats() {
  return request<BackendQueueStats>("/queue/stats");
}

export async function getDeadLetterQueue() {
  return request<BackendDeadLetterItem[]>("/queue/dead-letter");
}

export async function reprocessDeadLetter(id: string) {
  return request<{ message: string }>(`/queue/dead-letter/${id}/reprocess`, {
    method: "POST",
  });
}

export async function purgeDeadLetterQueue() {
  return request<{ message: string }>("/queue/dead-letter", {
    method: "DELETE",
  });
}

export async function clearQueue() {
  return request<{ message: string }>("/queue", {
    method: "DELETE",
  });
}

export async function getHealth() {
  return request<BackendHealth>("/health");
}

let _whatsappTargetCache: string | null | undefined;

export async function getWhatsAppTarget(): Promise<string> {
  if (_whatsappTargetCache !== undefined) return _whatsappTargetCache ?? "";
  try {
    const data = await request<{ target: string }>("/whatsapp/target");
    _whatsappTargetCache = data.target ?? "";
    return _whatsappTargetCache;
  } catch {
    _whatsappTargetCache = "";
    return "";
  }
}

export function invalidateWhatsAppTarget() {
  _whatsappTargetCache = undefined;
}

export async function saveWhatsAppTarget(target: string) {
  const data = await request<{ target: string }>("/whatsapp/target", {
    method: "PUT",
    body: JSON.stringify({ target }),
  });
  _whatsappTargetCache = data.target;
  return _whatsappTargetCache;
}
