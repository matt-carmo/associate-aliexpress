import axios from "axios";
import { config } from "../config/telegram.js";

export const sendPhoto = async ({ chatId, photoUrl, text }: { chatId: number; photoUrl: string; text: string }) => {
  if (!config.botToken) {
    throw new Error("Missing Telegram bot token. Set TELEGRAM_BOT_TOKEN.");
  }

  const url = `https://api.telegram.org/bot${config.botToken}/sendPhoto`;

  return axios.post(url, {
    chat_id: chatId,
    photo: photoUrl,
    parse_mode: "HTML",
    caption: text,
  });
};
