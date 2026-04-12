"use client";

import { formatTime } from "@/utils/format";

const WEEKDAYS_UA = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export default function DayBar({ date, mama, papa, maxTotal }) {
  const total = mama + papa;
  const barHeight = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  const mamaPercent = total > 0 ? (mama / total) * 100 : 50;

  const d = new Date(date + "T00:00:00");
  const weekday = WEEKDAYS_UA[d.getDay()];
  const day = d.getDate();
  const isToday = date === new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      {/* Time label */}
      <span className="text-[10px] text-zinc-500">
        {total > 0 ? formatTime(total) : "—"}
      </span>

      {/* Bar */}
      <div className="w-full h-32 flex flex-col justify-end rounded-lg overflow-hidden bg-zinc-800/50">
        <div
          className="w-full flex flex-col transition-all duration-300"
          style={{ height: `${barHeight}%` }}
        >
          <div
            className="bg-pink-400/80"
            style={{ height: `${mamaPercent}%` }}
          />
          <div
            className="bg-blue-400/80"
            style={{ height: `${100 - mamaPercent}%` }}
          />
        </div>
      </div>

      {/* Date label */}
      <div className={`text-center ${isToday ? "text-white" : "text-zinc-500"}`}>
        <div className="text-xs font-medium">{weekday}</div>
        <div className={`text-[10px] ${isToday ? "bg-white text-black rounded-full w-5 h-5 flex items-center justify-center mx-auto" : ""}`}>
          {day}
        </div>
      </div>
    </div>
  );
}
