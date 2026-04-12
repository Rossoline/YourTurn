"use client";

export default function ControlPanel({ activeParent, onSwitch, onReset }) {
  return (
    <div className="flex items-center gap-3 p-4 pb-8 bg-zinc-900 border-t border-zinc-800">
      <button
        onClick={() => onSwitch("mama")}
        className={`flex-1 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 active:scale-95 ${
          activeParent === "mama"
            ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30"
            : "bg-zinc-800 text-pink-400 hover:bg-zinc-700"
        }`}
      >
        {activeParent === "mama" ? "⏸ Мама" : "▶ Мама"}
      </button>

      <button
        onClick={onReset}
        className="w-14 h-14 rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all duration-200 active:scale-90 flex items-center justify-center text-xl"
        title="Скинути"
      >
        ↺
      </button>

      <button
        onClick={() => onSwitch("papa")}
        className={`flex-1 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 active:scale-95 ${
          activeParent === "papa"
            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
            : "bg-zinc-800 text-blue-400 hover:bg-zinc-700"
        }`}
      >
        {activeParent === "papa" ? "⏸ Тато" : "▶ Тато"}
      </button>
    </div>
  );
}
