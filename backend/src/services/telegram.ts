import axios from "axios";
import { config } from "../config/telegram";

export const sendPhoto = async ({ chatId, photoUrl, text }: { chatId: number; photoUrl: string; text: string }) => {
  if (!config.botToken) {
    throw new Error("Missing Telegram bot token. Set TELEGRAM_CHAT_ID.");
  }

  const url = `https://api.telegram.org/bot${config.botToken}/sendPhoto`;

  return axios.post(url, {
    chat_id: chatId,
    photo: photoUrl,
    parse_mode: "HTML",
    caption: text,
  });
};
