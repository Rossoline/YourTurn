"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserFamily } from "@/services/familyService";
import { getStats, aggregateStats } from "@/services/statsService";
import DayBar from "@/components/DayBar";
import StatsSummary from "@/components/StatsSummary";
import Link from "next/link";

const PERIODS = [
  { label: "7 днів", days: 7 },
  { label: "14 днів", days: 14 },
  { label: "30 днів", days: 30 },
];

export default function StatsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [period, setPeriod] = useState(7);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const member = await getUserFamily(supabase, user.id);
      if (!member) return;

      const data = await getStats(supabase, member.family_id, period);
      setStats(data);
      setLoading(false);
    }

    load();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950">
        <div className="text-zinc-500">Завантаження...</div>
      </div>
    );
  }

  const summary = aggregateStats(stats);
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

        {/* Summary */}
        <StatsSummary {...summary} />

        {/* Chart */}
        {stats.length > 0 ? (
          <div>
            <h2 className="text-zinc-400 text-sm font-medium mb-3">По днях</h2>
            <div className="flex gap-1">
              {stats.map((day) => (
                <DayBar
                  key={day.date}
                  date={day.date}
                  mama={day.mama}
                  papa={day.papa}
                  maxTotal={maxTotal}
                />
              ))}
            </div>
            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-pink-400/80" />
                <span className="text-zinc-500 text-xs">Мама</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-400/80" />
                <span className="text-zinc-500 text-xs">Тато</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-zinc-500 py-8">
            Немає даних за цей період
          </div>
        )}
      </div>
    </div>
  );
}
