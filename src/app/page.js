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

export default function Home() {
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [familyId, setFamilyId] = useState(null);
  const [activeParent, setActiveParent] = useState(null);
  const [mamaTime, setMamaTime] = useState(0);
  const [papaTime, setPapaTime] = useState(0);
  const [lastSwitchAt, setLastSwitchAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState(null);

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

    async function load() {
      // Find user's family
      const { data: member } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id)
        .single();

      if (member) {
        setFamilyId(member.family_id);
        await loadTimerState(member.family_id);
      }
      setLoading(false);
    }

    load();
  }, [user]);

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

    // Calculate elapsed time since last switch if timer is running
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

  // Calculate accumulated time (without ongoing elapsed)
  function getAccumulatedTime() {
    let mama = mamaTime;
    let papa = papaTime;

    // The displayed times already include elapsed from tick,
    // so we need the base times for saving
    if (activeParent && lastSwitchAt) {
      const elapsed = Date.now() - new Date(lastSwitchAt).getTime();
      if (activeParent === "mama") mama = mamaTime - elapsed;
      else papa = papaTime - elapsed;
    }

    return { mama: Math.max(0, mama), papa: Math.max(0, papa) };
  }

  const handleSwitch = async (parent) => {
    if (!familyId) return;

    // Accumulate current running time into stored value
    const accumulated = getAccumulatedTime();
    let newMama = accumulated.mama;
    let newPapa = accumulated.papa;

    // Add elapsed from current active parent
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

  const handleCreateFamily = async () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data } = await supabase
      .from("families")
      .insert({ invite_code: code })
      .select()
      .single();

    if (data) {
      await supabase
        .from("family_members")
        .insert({ family_id: data.id, user_id: user.id });
      setFamilyId(data.id);
      setInviteCode(code);
    }
  };

  const handleJoinFamily = async () => {
    setJoinError(null);
    const { data: family } = await supabase
      .from("families")
      .select("id")
      .eq("invite_code", joinCode.toUpperCase())
      .single();

    if (!family) {
      setJoinError("Сім'ю не знайдено");
      return;
    }

    const { error } = await supabase
      .from("family_members")
      .insert({ family_id: family.id, user_id: user.id });

    if (error) {
      setJoinError("Не вдалося приєднатися");
      return;
    }

    setFamilyId(family.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950">
        <div className="text-zinc-500">Завантаження...</div>
      </div>
    );
  }

  // No family yet — show create/join
  if (!familyId) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 bg-zinc-950 gap-6">
        <h1 className="text-2xl font-bold">Налаштуйте сім'ю</h1>
        <p className="text-zinc-400 text-center max-w-xs">
          Створіть нову сім'ю або приєднайтесь за кодом запрошення
        </p>

        <button
          onClick={handleCreateFamily}
          className="w-full max-w-xs py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
        >
          Створити сім'ю
        </button>

        {inviteCode && (
          <div className="text-center">
            <p className="text-zinc-400 text-sm">Код запрошення:</p>
            <p className="text-3xl font-mono font-bold tracking-widest mt-1">
              {inviteCode}
            </p>
            <p className="text-zinc-500 text-xs mt-2">
              Надішліть цей код партнеру
            </p>
          </div>
        )}

        <div className="w-full max-w-xs flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-500 text-sm">або</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <input
            type="text"
            placeholder="Код запрошення"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-center font-mono text-lg tracking-widest uppercase placeholder:text-zinc-500 placeholder:tracking-normal placeholder:font-sans placeholder:text-base focus:outline-none focus:border-zinc-600"
          />
          {joinError && (
            <p className="text-red-400 text-sm text-center">{joinError}</p>
          )}
          <button
            onClick={handleJoinFamily}
            disabled={!joinCode}
            className="w-full py-3 rounded-xl bg-zinc-800 text-white font-semibold hover:bg-zinc-700 transition-colors disabled:opacity-30"
          >
            Приєднатися
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="text-zinc-600 text-sm hover:text-zinc-400 mt-4"
        >
          Вийти
        </button>
      </div>
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
