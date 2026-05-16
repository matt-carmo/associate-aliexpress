import React from "react";

export const ScoreBadge = ({ score }: { score: number | undefined }) => {
  const s = typeof score === "number" ? score : 0;
  let color = "bg-gray-300 text-gray-700";
  if (s >= 80) color = "bg-green-600 text-white";
  else if (s >= 65) color = "bg-blue-600 text-white";
  else if (s >= 50) color = "bg-yellow-500 text-black";

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded ${color} text-xs font-semibold`}>
      <div className="w-8 text-center">{s}</div>
      <div className="w-20 h-2 bg-white/30 rounded overflow-hidden">
        <div className="h-2 bg-white rounded" style={{ width: `${Math.max(0, Math.min(100, s))}%` }} />
      </div>
    </div>
  );
};

export default ScoreBadge;
