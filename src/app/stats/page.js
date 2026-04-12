"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserFamily } from "@/services/familyService";
import { getParticipants } from "@/services/participantService";
import { getStats, aggregateStats } from "@/services/statsService";
import { getTodaySessions } from "@/services/timerService";
import DayBar from "@/components/DayBar";
import StatsSummary from "@/components/StatsSummary";
import TodayDetail from "@/components/TodayDetail";
import { getColor } from "@/utils/colors";
import { StatsSkeleton } from "@/components/Skeleton";
import Link from "next/link";

const PERIODS = [
  { label: "Сьогодні", days: 0 },
  { label: "7 днів", days: 7 },
  { label: "14 днів", days: 14 },
  { label: "30 днів", days: 30 },
];

export default function StatsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [period, setPeriod] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const member = await getUserFamily(supabase, user.id);
        if (!member) return;

        const parts = await getParticipants(supabase, member.family_id);
        setParticipants(parts);

        if (period === 0) {
          const [todayData, todaySessions] = await Promise.all([
            getStats(supabase, member.family_id, 1),
            getTodaySessions(supabase, member.family_id),
          ]);
          setStats(todayData);
          setSessions(todaySessions);
        } else {
          const data = await getStats(supabase, member.family_id, period);
          setStats(data);
          setSessions([]);
        }
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [period]);

  if (loading) {
    return <StatsSkeleton />;
  }

  const summary = aggregateStats(stats, participants);
  const maxTotal = Math.max(...stats.map((d) => d.total), 1);

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <Link href="/" className="text-zinc-400 hover:text-white text-sm">
          ← Таймер
        </Link>
        <h1 className="text-sm font-semibold">Статистика</h1>
        <div className="w-16" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-8">
        {/* Period selector */}
        <div className="flex gap-2 justify-center">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setPeriod(p.days)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                period === p.days
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Today detail view */}
        {period === 0 ? (
          <TodayDetail
            sessions={sessions}
            participants={participants}
            participantStats={summary.participantStats}
            grandTotal={summary.grandTotal}
          />
        ) : (
          <>
            {/* Summary */}
            {summary.participantStats.length > 0 ? (
              <StatsSummary {...summary} />
            ) : (
              <div className="text-center text-zinc-500 py-4">
                Немає даних за цей період
              </div>
            )}

            {/* Chart */}
            {stats.length > 0 && (
              <div>
                <h2 className="text-zinc-400 text-sm font-medium mb-3">По днях</h2>
                <div className="flex gap-1">
                  {stats.map((day) => (
                    <DayBar
                      key={day.date}
                      date={day.date}
                      participants={day.participants}
                      total={day.total}
                      maxTotal={maxTotal}
                      allParticipants={participants}
                    />
                  ))}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {participants.map((p) => {
                    const c = getColor(p.color);
                    return (
                      <div key={p.id} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-sm ${c.bar}`} />
                        <span className="text-zinc-500 text-xs">{p.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
