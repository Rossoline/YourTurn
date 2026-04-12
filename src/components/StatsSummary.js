"use client";

import { formatTime } from "@/utils/format";
import { getColor } from "@/utils/colors";

export default function StatsSummary({ participantStats, grandTotal }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex h-3 w-full rounded-full overflow-hidden">
        {participantStats.map((p) => {
          const c = getColor(p.color);
          return (
            <div
              key={p.id}
              className={`${c.bar} transition-all duration-500`}
              style={{ width: `${p.percent}%` }}
            />
          );
        })}
      </div>

      {/* Participant stats */}
      <div className="flex flex-wrap gap-4 justify-between">
        {participantStats.map((p) => {
          const c = getColor(p.color);
          return (
            <div key={p.id} className="flex flex-col items-center min-w-[70px]">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                <span className={`${c.textMuted} text-sm font-medium`}>{p.name}</span>
              </div>
              <span className="text-white text-lg font-bold font-mono">
                {formatTime(p.time)}
              </span>
              <span className={`${c.percentText} text-xs`}>
                {Math.round(p.percent)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Grand total */}
      <div className="text-center pt-2 border-t border-zinc-800">
        <span className="text-zinc-500 text-sm">Разом: </span>
        <span className="text-zinc-300 font-bold font-mono">{formatTime(grandTotal)}</span>
      </div>
    </div>
  );
}
