import { Router } from "express";
import { config as whatsappConfig } from "../config/whatsapp";
import { getConnectionStatus, getQRCode, getSocket, sendImage, sendText } from "../services/whatsapp";
import { getQueueStats } from "../storage/queueStorage";

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
