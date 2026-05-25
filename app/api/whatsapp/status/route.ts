import { config as telegramConfig } from "@/app/config/bot";
import { getConnectionStatus, getQRCode, getSocket } from "@/app/services/whatsapp";

export async function GET() {
  try {
    await getSocket();
  } catch {
    // socket init error
  }

  return Response.json({
    status: getConnectionStatus(),
    qrCode: getQRCode(),
    telegramChatId: telegramConfig.chatId || "",
  });
}
