"use client";

import { formatTime, todayDate } from "@/utils/format";
import { getColor } from "@/utils/colors";

const WEEKDAYS_UA = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export default function DayBar({ date, participants, total, maxTotal, allParticipants }) {
  const barHeight = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

  const d = new Date(date + "T00:00:00");
  const weekday = WEEKDAYS_UA[d.getDay()];
  const day = d.getDate();
  const isToday = date === todayDate();

  // Build segments for each participant
  const segments = allParticipants
    .map((p) => ({
      id: p.id,
      color: p.color,
      time: participants[p.id] || 0,
      percent: total > 0 ? ((participants[p.id] || 0) / total) * 100 : 0,
    }))
    .filter((s) => s.time > 0);

  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <span className="text-[10px] text-zinc-500">
        {total > 0 ? formatTime(total) : "—"}
      </span>

      <div className="w-full h-32 flex flex-col justify-end rounded-lg overflow-hidden bg-zinc-800/50">
        <div
          className="w-full flex flex-col transition-all duration-300"
          style={{ height: `${barHeight}%` }}
        >
          {segments.map((s) => {
            const c = getColor(s.color);
            return (
              <div
                key={s.id}
                className={c.bar}
                style={{ height: `${s.percent}%` }}
              />
            );
          })}
        </div>
      </div>

      <div className={`text-center ${isToday ? "text-white" : "text-zinc-500"}`}>
        <div className="text-xs font-medium">{weekday}</div>
        <div className={`text-[10px] ${isToday ? "bg-white text-black rounded-full w-5 h-5 flex items-center justify-center mx-auto" : ""}`}>
          {day}
        </div>
      </div>
    </div>
  );
}
