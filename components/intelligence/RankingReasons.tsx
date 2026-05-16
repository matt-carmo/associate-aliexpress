import React from "react";

export const RankingReasons = ({ reasons }: { reasons?: string[] }) => {
  if (!reasons || reasons.length === 0) return null;
  return (
    <ul className="text-xs text-gray-700 space-y-1 mt-2">
      {reasons.map((r, i) => (
        <li key={i} className="inline-block mr-2 px-2 py-0.5 bg-gray-100 rounded">{r}</li>
      ))}
    </ul>
  );
};

export default RankingReasons;
