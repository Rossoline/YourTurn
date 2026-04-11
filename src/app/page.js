"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function todayDate() {
  return new Date().toISOString().split("T")[0];
}

// ─── Onboarding screen ───
function OnboardingScreen({ user, supabase, onComplete, onLogout }) {
  const [mode, setMode] = useState(null); // "create" | "join"
  const [familyName, setFamilyName] = useState("");
  const [role, setRole] = useState(null); // "mama" | "papa"
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState(null);

  const handleCreate = async () => {
    if (!familyName.trim() || !role) return;
    setLoading(true);
    setError(null);

    // Check if user already has a family
    const { data: existing } = await supabase
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      // Already has a family, just reload
      window.location.reload();
      return;
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: family, error: famErr } = await supabase
      .from("families")
      .insert({ name: familyName.trim(), invite_code: code })
      .select()
      .single();

    if (famErr) {
      setError("Не вдалося створити сім'ю");
      setLoading(false);
      return;
    }

    const { error: memErr } = await supabase
      .from("family_members")
      .insert({ family_id: family.id, user_id: user.id, role });

    if (memErr) {
      setError("Не вдалося додати вас до сім'ї");
      setLoading(false);
      return;
    }

    setCreatedCode(code);
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || !role) return;
    setLoading(true);
    setError(null);

    const { data: family } = await supabase
      .from("families")
      .select("id")
      .eq("invite_code", joinCode.trim().toUpperCase())
      .single();

    if (!family) {
      setError("Сім'ю з таким кодом не знайдено");
      setLoading(false);
      return;
    }

    // Check if role is already taken
    const { data: existing } = await supabase
      .from("family_members")
      .select("role")
      .eq("family_id", family.id)
      .eq("role", role)
      .single();

    if (existing) {
      setError(`Роль "${role === "mama" ? "Мама" : "Тато"}" вже зайнята в цій сім'ї`);
      setLoading(false);
      return;
    }

    const { error: memErr } = await supabase
      .from("family_members")
      .insert({ family_id: family.id, user_id: user.id, role });

    if (memErr) {
      setError("Не вдалося приєднатися");
      setLoading(false);
      return;
    }

    onComplete(family.id);
  };

  // Show invite code after creating
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

  // Mode selection
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

        {/* Role selection */}
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

// ─── Main app ───
export default function Home() {
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [familyId, setFamilyId] = useState(null);
  const [hasFamily, setHasFamily] = useState(null); // null = loading, true/false
  const [activeParent, setActiveParent] = useState(null);
  const [mamaTime, setMamaTime] = useState(0);
  const [papaTime, setPapaTime] = useState(0);
  const [lastSwitchAt, setLastSwitchAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const intervalRef = useRef(null);
  const lastTickRef = useRef(null);

  // Load user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Load family & timer state
  useEffect(() => {
    if (!user) return;
    loadFamily();
  }, [user]);

  async function loadFamily() {
    const { data: member } = await supabase
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (member) {
      setFamilyId(member.family_id);
      setHasFamily(true);
      await loadTimerState(member.family_id);
    } else {
      setHasFamily(false);
    }
    setLoading(false);
  }

  // Real-time subscription
  useEffect(() => {
    if (!familyId) return;

    const channel = supabase
      .channel(`timer_${familyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "timer_state",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          const row = payload.new;
          if (row) {
            applyState(row);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId]);

  async function loadTimerState(fid) {
    const today = todayDate();
    const { data } = await supabase
      .from("timer_state")
      .select("*")
      .eq("family_id", fid)
      .eq("date", today)
      .single();

    if (data) {
      applyState(data);
    }
  }

  function applyState(row) {
    let mama = row.mama_time_ms || 0;
    let papa = row.papa_time_ms || 0;

    if (row.active_parent && row.last_switch_at) {
      const elapsed = Date.now() - new Date(row.last_switch_at).getTime();
      if (row.active_parent === "mama") mama += elapsed;
      else papa += elapsed;
    }

    setMamaTime(mama);
    setPapaTime(papa);
    setActiveParent(row.active_parent);
    setLastSwitchAt(row.last_switch_at);
  }

  // Local tick
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

  async function saveState(newActive, newMamaTime, newPapaTime) {
    const today = todayDate();
    const now = new Date().toISOString();

    await supabase.from("timer_state").upsert(
      {
        family_id: familyId,
        date: today,
        active_parent: newActive,
        mama_time_ms: newMamaTime,
        papa_time_ms: newPapaTime,
        last_switch_at: newActive ? now : null,
        updated_at: now,
      },
      { onConflict: "family_id,date" }
    );
  }

  function getAccumulatedTime() {
    let mama = mamaTime;
    let papa = papaTime;

    if (activeParent && lastSwitchAt) {
      const elapsed = Date.now() - new Date(lastSwitchAt).getTime();
      if (activeParent === "mama") mama = mamaTime - elapsed;
      else papa = papaTime - elapsed;
    }

    return { mama: Math.max(0, mama), papa: Math.max(0, papa) };
  }

  const handleSwitch = async (parent) => {
    if (!familyId) return;

    const accumulated = getAccumulatedTime();
    let newMama = accumulated.mama;
    let newPapa = accumulated.papa;

    if (activeParent && lastSwitchAt) {
      const elapsed = Date.now() - new Date(lastSwitchAt).getTime();
      if (activeParent === "mama") newMama += elapsed;
      else newPapa += elapsed;
    }

    const newActive = activeParent === parent ? null : parent;

    setActiveParent(newActive);
    setMamaTime(newMama);
    setPapaTime(newPapa);
    setLastSwitchAt(newActive ? new Date().toISOString() : null);

    await saveState(newActive, newMama, newPapa);
  };

  const handleReset = async () => {
    if (!familyId) return;
    setActiveParent(null);
    setMamaTime(0);
    setPapaTime(0);
    setLastSwitchAt(null);
    await saveState(null, 0, 0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleOnboardingComplete = async (fid) => {
    // Reload family from DB
    await loadFamily();
  };

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950">
        <div className="text-zinc-500">Завантаження...</div>
      </div>
    );
  }

  // Onboarding — no family yet
  if (hasFamily === false) {
    return (
      <OnboardingScreen
        user={user}
        supabase={supabase}
        onComplete={handleOnboardingComplete}
        onLogout={handleLogout}
      />
    );
  }

  const totalTime = mamaTime + papaTime;
  const mamaPercent = totalTime > 0 ? (mamaTime / totalTime) * 100 : 50;
  const papaPercent = totalTime > 0 ? (papaTime / totalTime) * 100 : 50;

  return (
    <div className="flex flex-col h-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <span className="text-sm font-medium text-zinc-400">
          {todayDate()}
        </span>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-zinc-400 hover:text-white text-xl px-2"
          >
            ⋮
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-zinc-800 rounded-xl border border-zinc-700 py-1 min-w-[180px] z-50">
              <button
                onClick={async () => {
                  const { data } = await supabase
                    .from("families")
                    .select("invite_code")
                    .eq("id", familyId)
                    .single();
                  if (data) {
                    navigator.clipboard?.writeText(data.invite_code);
                    alert(`Код: ${data.invite_code}`);
                  }
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                Код запрошення
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-700"
              >
                Вийти
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Timers area */}
      <div className="flex flex-col flex-1">
        {/* Mama timer */}
        <div
          className={`flex-1 flex flex-col items-center justify-center transition-all duration-500 ${
            activeParent === "mama" ? "bg-pink-950/80" : "bg-zinc-900/50"
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
            activeParent === "papa" ? "bg-blue-950/80" : "bg-zinc-900/50"
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
