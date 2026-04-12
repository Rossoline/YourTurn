"use client";

import { useState } from "react";
import { getColor } from "@/utils/colors";
import { createEvent, deleteEvent } from "@/services/calendarService";

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" });
}

function EventCard({ event, participant, onDelete }) {
  const c = participant ? getColor(participant.color) : null;

  return (
    <div className="flex items-start gap-3 bg-zinc-900 rounded-xl px-4 py-3">
      <div className={`w-1.5 self-stretch rounded-full mt-0.5 ${c ? c.bar : "bg-zinc-600"}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-zinc-200 font-medium text-sm">{event.title}</div>
            <div className="text-xs text-zinc-500 mt-0.5">
              {event.start_time.slice(0, 5)} — {event.end_time.slice(0, 5)}
            </div>
            {participant && (
              <div className={`text-xs mt-0.5 ${c ? c.textMuted : "text-zinc-500"}`}>
                {participant.name}
              </div>
            )}
          </div>
          <button
            onClick={() => onDelete(event.id)}
            className="text-zinc-600 hover:text-red-400 text-xs mt-0.5 shrink-0"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DayEvents({ date, events, participants, familyId, userId, supabase, onUpdate }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [participantId, setParticipantId] = useState("");
  const [saving, setSaving] = useState(false);

  const participantMap = {};
  for (const p of participants) {
    participantMap[p.id] = p;
  }

  const activeParticipants = participants.filter((p) => p.is_active);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createEvent(supabase, {
        familyId,
        participantId: participantId || null,
        title: title.trim(),
        date,
        startTime,
        endTime,
        userId,
      });
      setTitle("");
      setStartTime("09:00");
      setEndTime("10:00");
      setParticipantId("");
      setAdding(false);
      onUpdate();
    } catch (err) {
      console.error("Failed to create event:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eventId) => {
    try {
      await deleteEvent(supabase, eventId);
      onUpdate();
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-300 capitalize">
          {formatDateLabel(date)}
        </h3>
        <button
          onClick={() => setAdding(!adding)}
          className="text-xs font-medium text-white bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          {adding ? "Скасувати" : "+ Додати"}
        </button>
      </div>

      {/* Add event form */}
      {adding && (
        <div className="bg-zinc-900 rounded-xl p-4 mb-3 flex flex-col gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Назва події"
            className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-zinc-600"
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-zinc-500 mb-1 block">Початок</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-zinc-500 mb-1 block">Кінець</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Виконавець</label>
            <select
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-zinc-600"
            >
              <option value="">Не призначено</option>
              {activeParticipants.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !title.trim()}
            className="w-full bg-white text-black text-sm font-semibold rounded-lg py-2.5 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            {saving ? "Збереження..." : "Зберегти"}
          </button>
        </div>
      )}

      {/* Events list */}
      {events.length > 0 ? (
        <div className="flex flex-col gap-2">
          {events.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              participant={participantMap[ev.participant_id]}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        !adding && (
          <div className="text-center text-zinc-600 text-sm py-6">
            Подій немає
          </div>
        )
      )}
    </div>
  );
}
