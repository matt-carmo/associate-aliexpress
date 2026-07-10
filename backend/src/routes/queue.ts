import { Router } from "express";
import {
  clearQueue,
  enqueue,
  enqueueMany,
  getQueue,
  getQueueByStatus,
  getQueueSettings,
  getQueueStats,
  removeFromQueue,
  setQueueSettings,
  updateQueueItem,
  getDeadLetterQueue,
  reprocessDeadLetter,
  purgeDeadLetterQueue,
} from "../storage/queueStorage.js";

export const queueRouter = Router();

queueRouter.get("/", (_req, res) => {
  const queue = getQueue();
  const settings = getQueueSettings();
  const stats = getQueueStats();
  res.json({ queue, settings, stats });
});

queueRouter.get("/pending", (_req, res) => {
  const items = getQueueByStatus("pending");
  res.json(items);
});

queueRouter.get("/failed", (_req, res) => {
  const items = getQueueByStatus("failed");
  res.json(items);
});

queueRouter.post("/", (req, res) => {
  const { id, idempotencyKey, data, manualScheduledAt, caption, target, scheduledAt, status, priority, maxRetries } = req.body ?? {};

  if (!id || !data) {
    return res.status(400).json({ error: "id and data are required" });
  }

  enqueue({
    id,
    idempotencyKey,
    data,
    manualScheduledAt,
    caption,
    target,
    scheduledAt,
    status,
    priority,
    maxRetries,
  });

  return res.status(201).json({ message: "Item added to queue" });
});

queueRouter.post("/batch", (req, res) => {
  const { items } = req.body ?? {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items array is required" });
  }
  enqueueMany(items);
  return res.status(201).json({ message: "Batch enqueued", count: items.length });
});

queueRouter.put("/", (req, res) => {
  const body = req.body ?? {};

  if (body.settings) {
    setQueueSettings(body.settings);
    return res.json({ message: "Settings updated" });
  }

  return res.status(400).json({ error: "Invalid body" });
});

queueRouter.delete("/", (_req, res) => {
  clearQueue();
  return res.json({ message: "Queue cleared" });
});

queueRouter.get("/stats", (_req, res) => {
  const stats = getQueueStats();
  res.json(stats);
});

queueRouter.delete("/:id", (req, res) => {
  const { id } = req.params;
  removeFromQueue(id);
  return res.json({ message: "Item removed" });
});

queueRouter.put("/:id", (req, res) => {
  const { id } = req.params;
  const body = req.body ?? {};

  const current = getQueue().find((item) => item.id === id);
  if (!current) {
    return res.status(404).json({ error: "Item not found" });
  }

  const updates: Record<string, unknown> = {};
  if (body.manualScheduledAt !== undefined) updates.manualScheduledAt = body.manualScheduledAt;
  if (body.caption !== undefined) updates.caption = body.caption;
  if (body.target !== undefined) updates.target = body.target;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.maxRetries !== undefined) updates.maxRetries = body.maxRetries;

  updateQueueItem(id, updates);
  return res.json({ message: "Item updated" });
});

queueRouter.get("/dead-letter", (_req, res) => {
  const items = getDeadLetterQueue();
  res.json(items);
});

queueRouter.post("/dead-letter/:id/reprocess", (req, res) => {
  const { id } = req.params;
  const ok = reprocessDeadLetter(id);
  if (!ok) {
    return res.status(404).json({ error: "Dead letter item not found" });
  }
  return res.json({ message: "Item reprocessed" });
});

queueRouter.delete("/dead-letter", (_req, res) => {
  purgeDeadLetterQueue();
  return res.json({ message: "Dead letter queue purged" });
});
