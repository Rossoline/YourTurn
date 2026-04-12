"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserFamily, getFamilyInviteCode } from "@/services/familyService";
import { getParticipants } from "@/services/participantService";
import { useTimer } from "@/hooks/useTimer";
import { todayDate } from "@/utils/format";
import { getColor } from "@/utils/colors";
import Link from "next/link";
import OnboardingScreen from "@/components/OnboardingScreen";
import TimerDisplay from "@/components/TimerDisplay";
import ControlPanel from "@/components/ControlPanel";
import ParticipantManager from "@/components/ParticipantManager";
import BottomTabs from "@/components/BottomTabs";
import CalendarView from "@/components/CalendarView";
import { useToast } from "@/components/Toast";

export default function Home() {
  const supabase = createClient();
  const toast = useToast();

  const [user, setUser] = useState(null);
  const [familyId, setFamilyId] = useState(null);
  const [hasFamily, setHasFamily] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [activeTab, setActiveTab] = useState("timer");

  const timer = useTimer(supabase, familyId);

  const activeParticipants = participants.filter((p) => p.is_active);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;

    getUserFamily(supabase, user.id).then(async (member) => {
      try {
        if (member) {
          setFamilyId(member.family_id);
          setHasFamily(true);
          const p = await getParticipants(supabase, member.family_id);
          setParticipants(p);
        } else {
          setHasFamily(false);
        }
      } catch (err) {
        console.error("Failed to load family:", err);
        toast?.("Не вдалося завантажити дані", "error");
        setHasFamily(false);
      } finally {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, [user]);

  const reloadParticipants = useCallback(async () => {
    if (!familyId) return;
    const p = await getParticipants(supabase, familyId);
    setParticipants(p);
  }, [familyId, supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.href = "/login";
    }
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

  // No participants yet — show manage screen
  if (activeParticipants.length === 0 && !showManage) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 bg-zinc-950 gap-6">
        <h1 className="text-2xl font-bold">Додайте учасників</h1>
        <p className="text-zinc-400 text-center max-w-xs">
          Додайте тих, хто проводить час з дитиною — батьків, бабусю, няню тощо
        </p>
        <div className="w-full max-w-sm">
          <ParticipantManager
            supabase={supabase}
            familyId={familyId}
            participants={participants}
            onUpdate={reloadParticipants}
          />
        </div>
      </div>
    );
  }

  const totalTime = timer.totalTime;

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
                onClick={() => { setShowManage(!showManage); setShowMenu(false); }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                Учасники
              </button>
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

      {/* Manage participants panel */}
      {showManage && (
        <div className="px-4 py-4 bg-zinc-900/80 border-b border-zinc-800 overflow-y-auto max-h-[50vh]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-300">Учасники</h2>
            <button
              onClick={() => setShowManage(false)}
              className="text-zinc-500 text-xs hover:text-zinc-300"
            >
              Закрити
            </button>
          </div>
          <ParticipantManager
            supabase={supabase}
            familyId={familyId}
            participants={participants}
            onUpdate={reloadParticipants}
          />
        </div>
      )}

      {/* Tab content */}
      {activeTab === "timer" ? (
        <>
          {/* Timers */}
          <div className="flex flex-col flex-1">
            {activeParticipants.map((p) => {
              const time = timer.getTime(p.id);
              const percent = totalTime > 0 ? (time / totalTime) * 100 : null;

              return (
                <TimerDisplay
                  key={p.id}
                  name={p.name}
                  time={time}
                  percent={percent}
                  isActive={timer.activeParticipantId === p.id}
                  colorKey={p.color}
                  startedAt={timer.activeParticipantId === p.id ? timer.lastSwitchAt : null}
                />
              );
            })}

            {/* Progress bar */}
            {totalTime > 0 && (
              <div className="flex h-1.5 w-full">
                {activeParticipants.map((p) => {
                  const time = timer.getTime(p.id);
                  const percent = totalTime > 0 ? (time / totalTime) * 100 : 0;
                  const c = getColor(p.color);
                  return (
                    <div
                      key={p.id}
                      className={`${c.bar} transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <ControlPanel
            participants={activeParticipants}
            activeParticipantId={timer.activeParticipantId}
            onSwitch={timer.handleSwitch}
            onReset={timer.handleReset}
          />
        </>
      ) : (
        <CalendarView
          supabase={supabase}
          familyId={familyId}
          userId={user?.id}
          participants={participants}
        />
      )}

      {/* Bottom tabs */}
      <BottomTabs active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
