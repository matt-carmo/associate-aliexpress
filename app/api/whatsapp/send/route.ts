import { config } from "@/app/config/whatsapp";
import { sendImage, sendText } from "@/app/services/whatsapp";

export async function POST(request: Request) {
  const body = await request.json();
  const { to, imageUrl, caption, text } = body ?? {};

  const target = to ?? config.to;

  if (!target) {
    return Response.json({ error: "to is required" }, { status: 400 });
  }

  if (!imageUrl && !text) {
    return Response.json(
      { error: "imageUrl or text is required" },
      { status: 400 }
    );
  }

  try {
    if (text && !imageUrl) {
      await sendText(target, text);
      return Response.json({ message: "Text sent via WhatsApp!" }, { status: 200 });
    }

    await sendImage(target, imageUrl, caption ?? "");
    return Response.json({ message: "Image sent via WhatsApp!" }, { status: 200 });
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return Response.json({ error: "Failed to send via WhatsApp" }, { status: 500 });
  }
}
