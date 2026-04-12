"use client";

import { formatTime } from "@/utils/format";
import { getColor } from "@/utils/colors";

export default function TimerDisplay({ name, time, percent, isActive, colorKey }) {
  const c = getColor(colorKey);

  return (
    <div
      className={`flex-1 flex flex-col items-center justify-center transition-all duration-500 min-h-[120px] ${
        isActive ? c.bg : "bg-zinc-900/50"
      }`}
    >
      <span className={`text-sm font-medium uppercase tracking-widest ${c.textMuted} mb-2`}>
        {name}
      </span>
      <span
        className={`font-mono font-bold transition-all duration-300 ${
          isActive ? `text-5xl sm:text-7xl ${c.text}` : "text-3xl sm:text-5xl text-zinc-500"
        }`}
      >
        {formatTime(time)}
      </span>
      {percent !== null && (
        <span className={`text-xs ${c.percentText} mt-2`}>
          {Math.round(percent)}%
        </span>
      )}
    </div>
  );
}
