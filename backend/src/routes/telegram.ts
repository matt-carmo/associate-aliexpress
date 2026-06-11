import { Router } from "express";
import { config } from "../config/telegram";
import { sendPhoto } from "../services/telegram";

export const telegramRouter = Router();

telegramRouter.post("/send", async (req, res) => {
  const { chatId, photoUrl, caption } = req.body ?? {};

  if (!chatId || !photoUrl) {
    return res.status(400).json({ error: "chatId and photoUrl are required" });
  }

  if (!config.botToken) {
    return res.status(503).json({ error: "Missing Telegram bot token. Set TELEGRAM_BOT_TOKEN." });
  }

  try {
    await sendPhoto({ chatId, photoUrl, text: caption ?? "" });
    return res.status(200).json({ message: "Photo sent successfully!" });
  } catch (error) {
    console.error("Send photo error:", error);
    return res.status(500).json({ error: "Failed to send photo" });
  }
});
