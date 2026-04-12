"use client";

import { useState } from "react";
import { addParticipant, toggleParticipant } from "@/services/participantService";
import { PALETTE, getColor } from "@/utils/colors";

export default function ParticipantManager({ supabase, familyId, participants, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    const result = await addParticipant(supabase, {
      familyId,
      name: name.trim(),
      color: color || null,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setName("");
      setColor("");
      setShowAdd(false);
      onUpdate();
    }
    setLoading(false);
  };

  const handleToggle = async (id, currentlyActive) => {
    await toggleParticipant(supabase, id, !currentlyActive);
    onUpdate();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Current participants */}
      {participants.map((p) => {
        const c = getColor(p.color);
        return (
          <div
            key={p.id}
            className="flex items-center justify-between px-4 py-3 bg-zinc-800 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${c.dot}`} />
              <span className={p.is_active ? "text-white" : "text-zinc-500"}>
                {p.name}
              </span>
            </div>
            <button
              onClick={() => handleToggle(p.id, p.is_active)}
              className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                p.is_active
                  ? "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                  : "bg-zinc-900 text-zinc-500 hover:bg-zinc-700"
              }`}
            >
              {p.is_active ? "Активний" : "Неактивний"}
            </button>
          </div>
        );
      })}

      {/* Add form */}
      {showAdd ? (
        <div className="flex flex-col gap-3 p-4 bg-zinc-800 rounded-xl">
          <input
            type="text"
            placeholder="Ім'я учасника"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />

          {/* Color picker */}
          <div className="flex gap-2">
            {PALETTE.map((c) => (
              <button
                key={c.key}
                onClick={() => setColor(c.key)}
                className={`w-8 h-8 rounded-full ${c.dot} transition-all ${
                  color === c.key ? "ring-2 ring-white scale-110" : "opacity-60 hover:opacity-100"
                }`}
              />
            ))}
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!name.trim() || loading}
              className="flex-1 py-2 rounded-lg bg-white text-black font-semibold text-sm hover:bg-zinc-200 disabled:opacity-30"
            >
              {loading ? "..." : "Додати"}
            </button>
            <button
              onClick={() => { setShowAdd(false); setName(""); setError(null); }}
              className="px-4 py-2 rounded-lg bg-zinc-700 text-zinc-300 text-sm hover:bg-zinc-600"
            >
              Скасувати
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-500 text-sm hover:border-zinc-500 hover:text-zinc-300 transition-colors"
        >
          + Додати учасника
        </button>
      )}
    </div>
  );
}
