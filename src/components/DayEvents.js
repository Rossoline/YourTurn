"use client";

import { useState } from "react";
import { formatDateLabel, toParticipantMap } from "@/utils/format";
import { getColor } from "@/utils/colors";
import { useToast } from "@/components/Toast";
import { createEvent, updateEvent, deleteEvent } from "@/services/calendarService";

function EventCard({ event, participant, onEdit, onDelete }) {
  const c = participant ? getColor(participant.color) : null;

  return (
    <div className="flex items-start gap-3 bg-zinc-900 rounded-xl px-4 py-3">
      <div className={`w-1.5 self-stretch rounded-full mt-0.5 ${c ? c.bar : "bg-zinc-600"}`} />
      <button onClick={() => onEdit(event)} className="flex-1 min-w-0 text-left">
        <div className="text-zinc-200 font-medium text-sm">{event.title}</div>
        <div className="text-xs text-zinc-500 mt-0.5">
          {event.start_time.slice(0, 5)} — {event.end_time.slice(0, 5)}
        </div>
        {participant && (
          <div className={`text-xs mt-0.5 ${c ? c.textMuted : "text-zinc-500"}`}>
            {participant.name}
          </div>
        )}
      </button>
      <button
        onClick={() => onDelete(event.id)}
        aria-label="Видалити подію"
        className="text-zinc-600 hover:text-red-400 text-sm shrink-0 w-10 h-10 flex items-center justify-center -mr-2"
      >
        ✕
      </button>
    </div>
  );
}

function EventForm({ initial, participants, saving, error, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [startTime, setStartTime] = useState(initial?.start_time?.slice(0, 5) || "09:00");
  const [endTime, setEndTime] = useState(initial?.end_time?.slice(0, 5) || "10:00");
  const [participantId, setParticipantId] = useState(initial?.participant_id || "");

  const activeParticipants = participants.filter((p) => p.is_active);
  const timeInvalid = startTime >= endTime;
  const isEdit = !!initial?.id;

  return (
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
      {timeInvalid && (
        <p className="text-amber-400 text-xs">Час початку має бути раніше за кінець</p>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => onSave({ title, startTime, endTime, participantId })}
          disabled={saving || !title.trim() || timeInvalid}
          className="flex-1 bg-white text-black text-sm font-semibold rounded-lg py-2.5 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
        >
          {saving ? "..." : isEdit ? "Зберегти" : "Додати"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 bg-zinc-700 text-zinc-300 text-sm rounded-lg py-2.5 hover:bg-zinc-600 transition-colors"
        >
          Скасувати
        </button>
      </div>
    </div>
  );
}

export default function DayEvents({ date, events, participants, familyId, userId, supabase, onUpdate }) {
  const toast = useToast();
  const [mode, setMode] = useState(null); // null | "add" | eventId
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const participantMap = toParticipantMap(participants);

  const handleAdd = async ({ title, startTime, endTime, participantId }) => {
    setSaving(true);
    setError(null);

    const result = await createEvent(supabase, {
      familyId,
      participantId: participantId || null,
      title: title.trim(),
      date,
      startTime,
      endTime,
      userId,
    });

    if (result.error) {
      setError(result.error);
      toast?.(result.error, "error");
    } else {
      setMode(null);
      toast?.("Подію створено", "success");
      onUpdate();
    }
    setSaving(false);
  };

  const handleEdit = async (eventId, { title, startTime, endTime, participantId }) => {
    setSaving(true);
    setError(null);

    const result = await updateEvent(supabase, eventId, {
      title,
      startTime,
      endTime,
      participantId: participantId || null,
    }, familyId);

    if (result.error) {
      setError(result.error);
      toast?.(result.error, "error");
    } else {
      setMode(null);
      toast?.("Подію оновлено", "success");
      onUpdate();
    }
    setSaving(false);
  };

  const handleDelete = async (eventId) => {
    const result = await deleteEvent(supabase, eventId, familyId);
    if (result.error) {
      toast?.(result.error, "error");
    } else {
      setMode(null);
      toast?.("Подію видалено", "success");
      onUpdate();
    }
  };

  const editingEvent = mode && mode !== "add" ? events.find((e) => e.id === mode) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-300 capitalize">
          {formatDateLabel(date)}
        </h3>
        <button
          onClick={() => setMode(mode === "add" ? null : "add")}
          className="text-xs font-medium text-white bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          {mode === "add" ? "Скасувати" : "+ Додати"}
        </button>
      </div>

      {/* Add form */}
      {mode === "add" && (
        <EventForm
          participants={participants}
          saving={saving}
          error={error}
          onSave={handleAdd}
          onCancel={() => setMode(null)}
        />
      )}

      {/* Edit form */}
      {editingEvent && (
        <EventForm
          initial={editingEvent}
          participants={participants}
          saving={saving}
          error={error}
          onSave={(data) => handleEdit(editingEvent.id, data)}
          onCancel={() => setMode(null)}
        />
      )}

      {/* Events list */}
      {events.length > 0 ? (
        <div className="flex flex-col gap-2">
          {events.map((ev) => (
            ev.id === mode ? null : (
              <EventCard
                key={ev.id}
                event={ev}
                participant={participantMap[ev.participant_id]}
                onEdit={(e) => setMode(e.id)}
                onDelete={handleDelete}
              />
            )
          ))}
        </div>
      ) : (
        mode === null && (
          <div className="text-center text-zinc-600 text-sm py-6">
            Подій немає
          </div>
        )
      )}
    </div>
  );
}
