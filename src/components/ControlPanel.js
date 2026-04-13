"use client";

import { useState } from "react";
import { getColor } from "@/utils/colors";

export default function ControlPanel({ participants, activeParticipantId, onSwitch, onReset }) {
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

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
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    setBusy(true);
    setConfirmReset(false);
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
            aria-pressed={isActive}
            aria-label={`${isActive ? "Зупинити" : "Запустити"} ${p.name}`}
            className={`flex-1 min-w-[100px] min-h-[48px] py-3 rounded-2xl font-semibold text-base transition-all duration-200 active:scale-95 disabled:opacity-60 ${
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
        aria-label={confirmReset ? "Підтвердити скидання" : "Скинути таймер"}
        className={`w-12 h-12 rounded-full disabled:opacity-60 transition-all duration-200 active:scale-90 flex items-center justify-center text-lg shrink-0 ${
          confirmReset
            ? "bg-red-600 text-white animate-pulse"
            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
        }`}
        title={confirmReset ? "Натисніть ще раз" : "Скинути"}
      >
        ↺
      </button>
    </div>
  );
}
