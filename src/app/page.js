"use client";

import { useState, useEffect, useRef, useCallback } from "react";

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function Home() {
  const [activeParent, setActiveParent] = useState(null); // "mama" | "papa" | null
  const [mamaTime, setMamaTime] = useState(0);
  const [papaTime, setPapaTime] = useState(0);
  const intervalRef = useRef(null);
  const lastTickRef = useRef(null);

  const tick = useCallback(() => {
    const now = Date.now();
    const delta = now - lastTickRef.current;
    lastTickRef.current = now;

    if (activeParent === "mama") {
      setMamaTime((prev) => prev + delta);
    } else if (activeParent === "papa") {
      setPapaTime((prev) => prev + delta);
    }
  }, [activeParent]);

  useEffect(() => {
    if (activeParent) {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeParent, tick]);

  const handleSwitch = (parent) => {
    if (activeParent === parent) {
      // tap active parent — pause
      setActiveParent(null);
    } else {
      // switch to this parent
      setActiveParent(parent);
    }
  };

  const handleReset = () => {
    setActiveParent(null);
    setMamaTime(0);
    setPapaTime(0);
  };

  const totalTime = mamaTime + papaTime;
  const mamaPercent = totalTime > 0 ? (mamaTime / totalTime) * 100 : 50;
  const papaPercent = totalTime > 0 ? (papaTime / totalTime) * 100 : 50;

  return (
    <div className="flex flex-col h-full select-none">
      {/* Timers area */}
      <div className="flex flex-col flex-1">
        {/* Mama timer */}
        <div
          className={`flex-1 flex flex-col items-center justify-center transition-all duration-500 ${
            activeParent === "mama"
              ? "bg-pink-950/80"
              : "bg-zinc-900/50"
          }`}
        >
          <span className="text-sm font-medium uppercase tracking-widest text-pink-400/80 mb-2">
            Мама
          </span>
          <span
            className={`font-mono font-bold transition-all duration-300 ${
              activeParent === "mama"
                ? "text-7xl text-pink-300"
                : "text-5xl text-zinc-500"
            }`}
          >
            {formatTime(mamaTime)}
          </span>
          {totalTime > 0 && (
            <span className="text-xs text-pink-400/60 mt-2">
              {Math.round(mamaPercent)}%
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex h-1.5 w-full">
          <div
            className="bg-pink-400 transition-all duration-500"
            style={{ width: `${mamaPercent}%` }}
          />
          <div
            className="bg-blue-400 transition-all duration-500"
            style={{ width: `${papaPercent}%` }}
          />
        </div>

        {/* Papa timer */}
        <div
          className={`flex-1 flex flex-col items-center justify-center transition-all duration-500 ${
            activeParent === "papa"
              ? "bg-blue-950/80"
              : "bg-zinc-900/50"
          }`}
        >
          <span className="text-sm font-medium uppercase tracking-widest text-blue-400/80 mb-2">
            Тато
          </span>
          <span
            className={`font-mono font-bold transition-all duration-300 ${
              activeParent === "papa"
                ? "text-7xl text-blue-300"
                : "text-5xl text-zinc-500"
            }`}
          >
            {formatTime(papaTime)}
          </span>
          {totalTime > 0 && (
            <span className="text-xs text-blue-400/60 mt-2">
              {Math.round(papaPercent)}%
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 p-4 pb-8 bg-zinc-900 border-t border-zinc-800">
        <button
          onClick={() => handleSwitch("mama")}
          className={`flex-1 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 active:scale-95 ${
            activeParent === "mama"
              ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30"
              : "bg-zinc-800 text-pink-400 hover:bg-zinc-700"
          }`}
        >
          {activeParent === "mama" ? "⏸ Мама" : "▶ Мама"}
        </button>

        <button
          onClick={handleReset}
          className="w-14 h-14 rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all duration-200 active:scale-90 flex items-center justify-center text-xl"
          title="Скинути"
        >
          ↺
        </button>

        <button
          onClick={() => handleSwitch("papa")}
          className={`flex-1 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 active:scale-95 ${
            activeParent === "papa"
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
              : "bg-zinc-800 text-blue-400 hover:bg-zinc-700"
          }`}
        >
          {activeParent === "papa" ? "⏸ Тато" : "▶ Тато"}
        </button>
      </div>
    </div>
  );
}
