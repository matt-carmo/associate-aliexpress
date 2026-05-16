import { sendPhoto } from "@/app/services/sendPhoto";
import { config } from "@/app/config/bot";

export async function POST(request: Request) {
  const body = await request.json();
  const { chatId, photoUrl, caption, product } = body ?? {};

  if (!chatId || !photoUrl) {
    return Response.json({ error: "chatId and photoUrl are required" }, { status: 400 });
  }

  if (!config.botToken) {
    return Response.json(
      { error: "Missing Telegram bot token. Set TELEGRAM_BOT_TOKEN." },
      { status: 503 }
    );
  }

  try {
    await sendPhoto({ chatId, photoUrl, text: caption ?? "" });
    return Response.json({ message: "Photo sent successfully!" }, { status: 200 });
  } catch (error) {
    console.error("Send photo error:", error);
    return Response.json({ error: "Failed to send photo" }, { status: 500 });
  }
}