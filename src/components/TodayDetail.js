"use client";

import { formatTime, formatClock, toParticipantMap } from "@/utils/format";
import { getColor } from "@/utils/colors";

function sessionDuration(session) {
  const start = new Date(session.started_at).getTime();
  const end = session.ended_at ? new Date(session.ended_at).getTime() : Date.now();
  return end - start;
}

export default function TodayDetail({ sessions, participants, participantStats, grandTotal }) {
  const participantMap = toParticipantMap(participants);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      {participantStats.length > 0 && (
        <div className="flex flex-col gap-3">
          {participantStats.map((ps) => {
            const c = getColor(ps.color);
            return (
              <div key={ps.id} className="flex items-center justify-between bg-zinc-900 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${c.dot}`} />
                  <span className="text-zinc-200 font-medium">{ps.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold font-mono">{formatTime(ps.time)}</span>
                  <span className={`text-xs ${c.percentText} min-w-[36px] text-right`}>{Math.round(ps.percent)}%</span>
                </div>
              </div>
            );
          })}
          <div className="text-center text-zinc-500 text-sm">
            Разом: <span className="text-zinc-300 font-bold font-mono">{formatTime(grandTotal)}</span>
          </div>
        </div>
      )}

      {/* Sessions timeline */}
      {sessions.length > 0 ? (
        <div>
          <h3 className="text-zinc-400 text-sm font-medium mb-3">Сесії</h3>
          <div className="flex flex-col gap-1.5">
            {sessions.map((s, i) => {
              const p = participantMap[s.participant_id];
              if (!p) return null;
              const c = getColor(p.color);
              const dur = sessionDuration(s);
              const isOngoing = !s.ended_at;

              return (
                <div key={i} className="flex items-center gap-3 bg-zinc-900/60 rounded-lg px-3 py-2">
                  <div className={`w-1.5 self-stretch rounded-full ${c.bar}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${c.textMuted}`}>{p.name}</span>
                      <span className="text-zinc-400 font-mono text-xs">{formatTime(dur)}</span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {formatClock(s.started_at)} — {isOngoing ? (
                        <span className="text-emerald-400">зараз</span>
                      ) : formatClock(s.ended_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center text-zinc-500 py-4">
          Сьогодні ще не було сесій
        </div>
      )}
    </div>
  );
}
