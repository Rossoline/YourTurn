"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserFamily, getFamilyInviteCode } from "@/services/familyService";
import { useTimer } from "@/hooks/useTimer";
import { todayDate } from "@/utils/format";
import Link from "next/link";
import OnboardingScreen from "@/components/OnboardingScreen";
import TimerDisplay from "@/components/TimerDisplay";
import ControlPanel from "@/components/ControlPanel";

export default function Home() {
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [familyId, setFamilyId] = useState(null);
  const [hasFamily, setHasFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const timer = useTimer(supabase, familyId);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  useEffect(() => {
    if (!user) return;

    getUserFamily(supabase, user.id).then((member) => {
      if (member) {
        setFamilyId(member.family_id);
        setHasFamily(true);
      } else {
        setHasFamily(false);
      }
      setLoading(false);
    });
  }, [user]);

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

  if (hasFamily === false) {
    return (
      <OnboardingScreen
        user={user}
        supabase={supabase}
        onComplete={() => window.location.reload()}
        onLogout={handleLogout}
      />
    );
  }

  const totalTime = timer.mamaTime + timer.papaTime;
  const mamaPercent = totalTime > 0 ? (timer.mamaTime / totalTime) * 100 : 50;
  const papaPercent = totalTime > 0 ? (timer.papaTime / totalTime) * 100 : 50;

  return (
    <div className="flex flex-col h-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <span className="text-sm font-medium text-zinc-400">{todayDate()}</span>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-zinc-400 hover:text-white text-xl px-2"
          >
            ⋮
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-zinc-800 rounded-xl border border-zinc-700 py-1 min-w-[180px] z-50">
              <Link
                href="/stats"
                onClick={() => setShowMenu(false)}
                className="block w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                Статистика
              </Link>
              <button
                onClick={async () => {
                  const code = await getFamilyInviteCode(supabase, familyId);
                  if (code) {
                    navigator.clipboard?.writeText(code);
                    alert(`Код: ${code}`);
                  }
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                Код запрошення
              </button>
              <button
                onClick={() => { handleLogout(); setShowMenu(false); }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-700"
              >
                Вийти
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Conflict banner */}
      {timer.conflict && (
        <div
          className="flex items-center justify-between px-4 py-2 bg-amber-900/80 text-amber-200 text-sm cursor-pointer"
          onClick={timer.dismissConflict}
        >
          <span>Хтось змінив таймер. Оновлено.</span>
          <span className="text-amber-400 font-medium">OK</span>
        </div>
      )}

      {/* Timers */}
      <div className="flex flex-col flex-1">
        <TimerDisplay
          label="Мама"
          time={timer.mamaTime}
          percent={totalTime > 0 ? mamaPercent : null}
          isActive={timer.activeParent === "mama"}
          color="pink"
        />

        <div className="flex h-1.5 w-full">
          <div className="bg-pink-400 transition-all duration-500" style={{ width: `${mamaPercent}%` }} />
          <div className="bg-blue-400 transition-all duration-500" style={{ width: `${papaPercent}%` }} />
        </div>

        <TimerDisplay
          label="Тато"
          time={timer.papaTime}
          percent={totalTime > 0 ? papaPercent : null}
          isActive={timer.activeParent === "papa"}
          color="blue"
        />
      </div>

      <ControlPanel
        activeParent={timer.activeParent}
        onSwitch={timer.handleSwitch}
        onReset={timer.handleReset}
      />
    </div>
  );
}
