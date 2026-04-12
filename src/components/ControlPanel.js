"use client";

import { useState } from "react";
import { getColor } from "@/utils/colors";

export default function ControlPanel({ participants, activeParticipantId, onSwitch, onReset }) {
  const [busy, setBusy] = useState(false);

  const handleSwitch = async (id) => {
    if (busy) return;
    setBusy(true);
    try {
      await onSwitch(id);
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onReset();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 pb-8 bg-zinc-900 border-t border-zinc-800">
      {participants.map((p) => {
        const c = getColor(p.color);
        const isActive = activeParticipantId === p.id;

        return (
          <button
            key={p.id}
            onClick={() => handleSwitch(p.id)}
            disabled={busy}
            className={`flex-1 min-w-[80px] py-3 rounded-2xl font-semibold text-base transition-all duration-200 active:scale-95 disabled:opacity-60 ${
              isActive
                ? `${c.btn} text-white shadow-lg`
                : `bg-zinc-800 ${c.btnInactive} hover:bg-zinc-700`
            }`}
          >
            {isActive ? "⏸" : "▶"} {p.name}
          </button>
        );
      })}

      <button
        onClick={handleReset}
        disabled={busy}
        className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:opacity-60 transition-all duration-200 active:scale-90 flex items-center justify-center text-lg shrink-0"
        title="Скинути"
      >
        ↺
      </button>
    </div>
  );
}
