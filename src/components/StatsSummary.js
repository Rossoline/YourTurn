"use client";

import { formatTime } from "@/utils/format";

export default function StatsSummary({ totalMama, totalPapa, total, mamaPercent, papaPercent }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex h-3 w-full rounded-full overflow-hidden">
        <div
          className="bg-pink-400 transition-all duration-500"
          style={{ width: `${mamaPercent}%` }}
        />
        <div
          className="bg-blue-400 transition-all duration-500"
          style={{ width: `${papaPercent}%` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between">
        <div className="flex flex-col items-start">
          <span className="text-pink-400 text-sm font-medium">Мама</span>
          <span className="text-white text-lg font-bold font-mono">
            {formatTime(totalMama)}
          </span>
          <span className="text-pink-400/60 text-xs">
            {Math.round(mamaPercent)}%
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-zinc-400 text-sm font-medium">Разом</span>
          <span className="text-zinc-300 text-lg font-bold font-mono">
            {formatTime(total)}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-blue-400 text-sm font-medium">Тато</span>
          <span className="text-white text-lg font-bold font-mono">
            {formatTime(totalPapa)}
          </span>
          <span className="text-blue-400/60 text-xs">
            {Math.round(papaPercent)}%
          </span>
        </div>
      </div>
    </div>
  );
}
