import React from "react";

export const ViralIndicator = ({ signals }: { signals?: Record<string, number> }) => {
  const visual = signals?.visualHook ?? signals?.visual_hook ?? 0;
  const momentum = signals?.salesMomentum ?? signals?.sales_momentum ?? 0;
  const hot = visual >= 7 || momentum >= 8;

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-0.5 rounded text-xs ${hot ? 'bg-pink-100 text-pink-800' : 'bg-gray-100 text-gray-700'}`}>
      {hot ? '🔥 Viral Potential' : '—'}
    </div>
  );
};

export default ViralIndicator;
