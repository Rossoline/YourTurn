"use client";

import { useState } from "react";
import { createFamily, joinFamily, getUserFamily } from "@/services/familyService";

export default function OnboardingScreen({ user, supabase, onComplete, onLogout }) {
  const [mode, setMode] = useState(null);
  const [familyName, setFamilyName] = useState("");
  const [role, setRole] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState(null);

  const handleCreate = async () => {
    if (!familyName.trim() || !role) return;
    setLoading(true);
    setError(null);

    const existing = await getUserFamily(supabase, user.id);
    if (existing) {
      window.location.reload();
      return;
    }

    const result = await createFamily(supabase, {
      name: familyName.trim(),
      userId: user.id,
      role,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setCreatedCode(result.inviteCode);
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || !role) return;
    setLoading(true);
    setError(null);

    const result = await joinFamily(supabase, {
      inviteCode: joinCode,
      userId: user.id,
      role,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onComplete(result.familyId);
  };

  if (createdCode) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 bg-zinc-950 gap-6">
        <h1 className="text-2xl font-bold">Сім'ю створено!</h1>
        <div className="text-center">
          <p className="text-zinc-400 text-sm">Код запрошення для партнера:</p>
          <p className="text-3xl font-mono font-bold tracking-widest mt-2">
            {createdCode}
          </p>
          <p className="text-zinc-500 text-xs mt-2">
            Надішліть цей код партнеру, щоб приєднатися
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full max-w-xs py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
        >
          Продовжити
        </button>
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 bg-zinc-950 gap-6">
        <h1 className="text-3xl font-bold">YourTurn</h1>
        <p className="text-zinc-400 text-center max-w-xs">
          Вітаємо! Створіть нову сім'ю або приєднайтесь до існуючої
        </p>
        <div className="w-full max-w-xs flex flex-col gap-3">
          <button
            onClick={() => setMode("create")}
            className="w-full py-4 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
          >
            Створити сім'ю
          </button>
          <button
            onClick={() => setMode("join")}
            className="w-full py-4 rounded-xl bg-zinc-800 text-white font-semibold hover:bg-zinc-700 transition-colors"
          >
            Приєднатися за кодом
          </button>
        </div>
        <button
          onClick={onLogout}
          className="text-zinc-600 text-sm hover:text-zinc-400 mt-2"
        >
          Вийти
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 bg-zinc-950 gap-6">
      <h1 className="text-2xl font-bold">
        {mode === "create" ? "Нова сім'я" : "Приєднатися"}
      </h1>

      <div className="w-full max-w-xs flex flex-col gap-4">
        {mode === "create" && (
          <input
            type="text"
            placeholder="Назва сім'ї"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        )}

        {mode === "join" && (
          <input
            type="text"
            placeholder="Код запрошення"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-center font-mono text-lg tracking-widest uppercase placeholder:text-zinc-500 placeholder:tracking-normal placeholder:font-sans placeholder:text-base focus:outline-none focus:border-zinc-600"
          />
        )}

        <div>
          <p className="text-zinc-400 text-sm mb-2">Ваша роль:</p>
          <div className="flex gap-3">
            <button
              onClick={() => setRole("mama")}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                role === "mama"
                  ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30"
                  : "bg-zinc-800 text-pink-400 hover:bg-zinc-700"
              }`}
            >
              Мама
            </button>
            <button
              onClick={() => setRole("papa")}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                role === "papa"
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "bg-zinc-800 text-blue-400 hover:bg-zinc-700"
              }`}
            >
              Тато
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <button
          onClick={mode === "create" ? handleCreate : handleJoin}
          disabled={loading || !role || (mode === "create" ? !familyName.trim() : !joinCode.trim())}
          className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-30"
        >
          {loading
            ? "Зачекайте..."
            : mode === "create"
              ? "Створити"
              : "Приєднатися"}
        </button>

        <button
          onClick={() => {
            setMode(null);
            setError(null);
            setRole(null);
          }}
          className="text-zinc-500 text-sm hover:text-zinc-300 text-center"
        >
          Назад
        </button>
      </div>
    </div>
  );
}
