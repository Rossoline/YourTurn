"use client";

import { formatTime } from "@/utils/format";

export default function TimerDisplay({ label, time, percent, isActive, color }) {
  const colors = {
    pink: {
      bg: "bg-pink-950/80",
      label: "text-pink-400/80",
      timeActive: "text-pink-300",
      percent: "text-pink-400/60",
    },
    blue: {
      bg: "bg-blue-950/80",
      label: "text-blue-400/80",
      timeActive: "text-blue-300",
      percent: "text-blue-400/60",
    },
  };

  const c = colors[color];

  return (
    <div
      className={`flex-1 flex flex-col items-center justify-center transition-all duration-500 ${
        isActive ? c.bg : "bg-zinc-900/50"
      }`}
    >
      <span className={`text-sm font-medium uppercase tracking-widest ${c.label} mb-2`}>
        {label}
      </span>
      <span
        className={`font-mono font-bold transition-all duration-300 ${
          isActive ? `text-7xl ${c.timeActive}` : "text-5xl text-zinc-500"
        }`}
      >
        {formatTime(time)}
      </span>
      {percent !== null && (
        <span className={`text-xs ${c.percent} mt-2`}>
          {Math.round(percent)}%
        </span>
      )}
    </div>
  );
}
