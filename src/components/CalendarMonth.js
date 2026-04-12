"use client";

import { toParticipantMap } from "@/utils/format";
import { getColor } from "@/utils/colors";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

function getMonthGrid(year, month) {
  const first = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();
  // Monday = 0, Sunday = 6
  let startDow = first.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(d);
  return cells;
}

function formatMonthName(year, month) {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("uk-UA", { month: "long", year: "numeric" });
}

export default function CalendarMonth({
  year,
  month,
  events,
  participants,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}) {
  const cells = getMonthGrid(year, month);
  const today = new Date();
  const todayStr =
    today.getFullYear() === year && today.getMonth() + 1 === month
      ? today.getDate()
      : null;

  // Group events by day number
  const eventsByDay = {};
  for (const e of events) {
    const day = parseInt(e.date.split("-")[2], 10);
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(e);
  }

  const participantMap = toParticipantMap(participants);

  const selectedDay = selectedDate ? parseInt(selectedDate.split("-")[2], 10) : null;

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrevMonth} className="text-zinc-400 hover:text-white px-3 py-1 text-lg">
          ‹
        </button>
        <h2 className="text-sm font-semibold text-zinc-200 capitalize">
          {formatMonthName(year, month)}
        </h2>
        <button onClick={onNextMonth} className="text-zinc-400 hover:text-white px-3 py-1 text-lg">
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-center text-xs text-zinc-500 font-medium py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />;
          }

          const isToday = day === todayStr;
          const isSelected = day === selectedDay;
          const dayEvents = eventsByDay[day] || [];

          return (
            <button
              key={day}
              onClick={() => {
                const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                onSelectDate(dateStr);
              }}
              className={`flex flex-col items-center py-1.5 rounded-lg transition-colors min-h-[44px] ${
                isSelected
                  ? "bg-white text-black"
                  : isToday
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-300 hover:bg-zinc-800/60"
              }`}
            >
              <span className={`text-sm font-medium ${isSelected ? "text-black" : ""}`}>
                {day}
              </span>
              {/* Event dots */}
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 3).map((ev, j) => {
                    const p = participantMap[ev.participant_id];
                    const c = p ? getColor(p.color) : null;
                    return (
                      <div
                        key={j}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? "bg-black/40" : c ? c.dot : "bg-zinc-500"
                        }`}
                      />
                    );
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
