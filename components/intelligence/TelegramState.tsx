import React from "react";

export const TELEGRAM_THRESHOLD = 65;

export const TelegramState = ({ score }: { score?: number }) => {
  const s = typeof score === "number" ? score : 0;
  const approved = s >= TELEGRAM_THRESHOLD;
  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {approved ? 'Telegram Ready' : 'Not Telegram Ready'}
    </div>
  );
};

export default TelegramState;
