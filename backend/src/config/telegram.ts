export const config = {
    botToken: process.env.TELEGRAM_CHAT_ID ?? "",
    botId: process.env.TELEGRAM_BOT_ID ?? "",
    chatId: Number(process.env.TELEGRAM_CHAT_ID) || -1002399025968,
};