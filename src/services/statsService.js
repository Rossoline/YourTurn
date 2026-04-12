export async function getStats(supabase, familyId, days = 7) {
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  const fromStr = from.toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  // Get entries and active state
  const [{ data: entries }, { data: state }] = await Promise.all([
    supabase
      .from("timer_entries")
      .select("participant_id, date, time_ms")
      .eq("family_id", familyId)
      .gte("date", fromStr)
      .order("date"),
    supabase
      .from("timer_state")
      .select("active_participant_id, last_switch_at")
      .eq("family_id", familyId)
      .eq("date", today)
      .maybeSingle(),
  ]);

  if (!entries) return [];

  // Group by date
  const byDate = {};
  for (const e of entries) {
    if (!byDate[e.date]) byDate[e.date] = {};
    byDate[e.date][e.participant_id] = e.time_ms || 0;
  }

  // Add elapsed for today's active participant
  if (state?.active_participant_id && state?.last_switch_at && byDate[today]) {
    const elapsed = Date.now() - new Date(state.last_switch_at).getTime();
    const pid = state.active_participant_id;
    byDate[today][pid] = (byDate[today][pid] || 0) + elapsed;
  }

  return Object.entries(byDate)
    .map(([date, participants]) => {
      const total = Object.values(participants).reduce((s, t) => s + t, 0);
      return { date, participants, total };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateStats(days, allParticipants) {
  const totals = {};

  for (const day of days) {
    for (const [pid, ms] of Object.entries(day.participants)) {
      totals[pid] = (totals[pid] || 0) + ms;
    }
  }

  const grandTotal = Object.values(totals).reduce((s, t) => s + t, 0);

  const participantStats = allParticipants.map((p) => {
    const time = totals[p.id] || 0;
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      time,
      percent: grandTotal > 0 ? (time / grandTotal) * 100 : 0,
    };
  }).filter((p) => p.time > 0);

  return {
    participantStats,
    grandTotal,
    daysTracked: days.length,
  };
}
