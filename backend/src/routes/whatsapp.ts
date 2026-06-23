import { Router } from "express";
import { config as whatsappConfig } from "../config/whatsapp.js";
import { getConnectionStatus, getQRCode, getSocket, sendImage, sendText } from "../services/whatsapp.js";
import { getDb } from "../storage/database.js";
import { getQueueStats } from "../storage/queueStorage.js";

export const whatsappRouter = Router();

whatsappRouter.get("/status", async (_req, res) => {
  try {
    await getSocket();
  } catch {
  }

  const waStatus = getConnectionStatus();
  const qrCode = getQRCode();
  const stats = getQueueStats();

  res.json({
    connection: waStatus,
    qrCode,
    target: whatsappConfig.to || null,
    queue: {
      pending: stats.pending,
      processing: stats.processing,
      failed: stats.failed,
      deadLetter: stats.deadLetter,
    },
    lastError: stats.lastError,
  });
});

whatsappRouter.get("/target", (_req, res) => {
  const db = getDb();
  const row = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get("whatsapp_target") as { value: string } | undefined;

  const target = row?.value ?? whatsappConfig.to ?? "";
  res.json({ target });
});

whatsappRouter.put("/target", (req, res) => {
  const { target } = req.body ?? {};

  if (typeof target !== "string") {
    return res.status(400).json({ error: "target must be a string" });
  }

  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(
    "whatsapp_target",
    target
  );

  res.json({ target });
});

whatsappRouter.post("/send", async (req, res) => {
  const { to, imageUrl, caption, text } = req.body ?? {};
  const target = to ?? whatsappConfig.to;
  console.log(target)
  if (!target) {
    return res.status(400).json({ error: "to is required" });
  }

  if (!imageUrl && !text) {
    return res.status(400).json({ error: "imageUrl or text is required" });
  }

  try {
    if (text && !imageUrl) {
      await sendText(target, text);
      return res.status(200).json({ message: "Text sent via WhatsApp!" });
    }

    await sendImage(target, imageUrl, caption ?? "");
    return res.status(200).json({ message: "Image sent via WhatsApp!" });
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return res.status(500).json({ error: "Failed to send via WhatsApp" });
  }
});
