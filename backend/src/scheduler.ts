import {
  claimNextItem,
  getQueue,
  getQueueStats,
  getQueueSettings,
  markAsFailed,
  markAsSent,
  cleanupOrphanedProcessing,
} from "./storage/queueStorage";
import type { QueueItem } from "./storage/queueTypes";
import { sendPhoto } from "./services/telegram";
import { sendImage } from "./services/whatsapp";
import { config as telegramConfig } from "./config/telegram";
import { config as whatsappConfig } from "./config/whatsapp";

const CHAT_ID = telegramConfig.chatId || -1002399025968;
const POLL_INTERVAL_MS = 10_000;
const CLEANUP_INTERVAL_MS = 60_000;

let running = false;
let intervalHandle: ReturnType<typeof setInterval> | null = null;
let cleanupHandle: ReturnType<typeof setInterval> | null = null;

async function sendViaWhatsApp(item: QueueItem): Promise<boolean> {
  const { data, caption } = item;
  const imageUrl = (data as Record<string, unknown>)?.imageUrl as string | undefined;
  if (!imageUrl) return false;

  const target = whatsappConfig.to;
  if (!target) {
    console.warn("[Scheduler] WHATSAPP_CHAT_ID not set — skipping WhatsApp send");
    return false;
  }

  try {
    await sendImage(target, imageUrl, caption ?? "");
    return true;
  } catch (err) {
    console.error(`[Scheduler] WhatsApp send failed for ${item.id}:`, err);
    return false;
  }
}

async function sendViaTelegram(item: QueueItem): Promise<boolean> {
  const { data, caption } = item;
  const imageUrl = (data as Record<string, unknown>)?.imageUrl as string | undefined;
  if (!imageUrl) return false;

  try {
    await sendPhoto({ chatId: CHAT_ID, photoUrl: imageUrl, text: caption ?? "" });
    return true;
  } catch (err) {
    console.error(`[Scheduler] Telegram send failed for ${item.id}:`, err);
    return false;
  }
}

async function processItem(item: QueueItem): Promise<void> {
  const title = (item.data as Record<string, unknown>)?.title ?? item.id;

  console.log(`[Scheduler] Processing ${item.id}: ${title}`);

  const [tgOk, waOk] = await Promise.allSettled([
    sendViaTelegram(item),
    sendViaWhatsApp(item),
  ]);

  const failures: string[] = [];

  if (tgOk.status === "rejected" || (tgOk.status === "fulfilled" && !tgOk.value)) {
    failures.push("Telegram");
  }
  if (waOk.status === "rejected" || (waOk.status === "fulfilled" && !waOk.value)) {
    failures.push("WhatsApp");
  }

  if (failures.length > 0) {
    const error = `${failures.join(", ")} failed for ${title}`;
    console.warn(`[Scheduler] ${error}`);
    markAsFailed(item.id, error);
    return;
  }

  markAsSent(item.id);
  console.log(`[Scheduler] Posted: ${title}`);
}

async function tick() {
  try {
    const item = claimNextItem();
    if (!item) return;

    await processItem(item);
  } catch (err) {
    console.error("[Scheduler] Tick error:", err);
  }
}

async function logStatus() {
  try {
    const stats = getQueueStats();
    const settings = getQueueSettings();

    const parts: string[] = [];
    if (stats.pending > 0) parts.push(`${stats.pending} pending`);
    if (stats.processing > 0) parts.push(`${stats.processing} processing`);
    if (stats.failed > 0) parts.push(`${stats.failed} failed`);

    if (parts.length > 0) {
      const queueDesc = parts.join(", ");
      const activeWindow = `${settings.activeStart}-${settings.activeEnd}`;
      console.log(`[Scheduler] Queue: ${queueDesc} | Window: ${activeWindow}`);
    }

    if (stats.nextScheduledAt) {
      const mins = Math.round((stats.nextScheduledAt - Date.now()) / 60000);
      if (mins > 0) {
        console.log(`[Scheduler] Next post in ~${mins} min`);
      }
    }
  } catch {
  }
}

export function startScheduler() {
  if (running) return;
  running = true;

  cleanupOrphanedProcessing();
  logStatus();

  console.log("[Scheduler] Started (polling every 10s)");

  tick();
  intervalHandle = setInterval(tick, POLL_INTERVAL_MS);

  cleanupHandle = setInterval(() => {
    cleanupOrphanedProcessing();
    logStatus();
  }, CLEANUP_INTERVAL_MS);
}

export function stopScheduler() {
  running = false;
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  if (cleanupHandle) {
    clearInterval(cleanupHandle);
    cleanupHandle = null;
  }
  console.log("[Scheduler] Stopped");
}
