export async function getStats(supabase, familyId, days = 7) {
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  const fromStr = from.toISOString().split("T")[0];

  const { data } = await supabase
    .from("timer_state")
    .select("date, mama_time_ms, papa_time_ms, active_parent, last_switch_at")
    .eq("family_id", familyId)
    .gte("date", fromStr)
    .order("date", { ascending: true });

  if (!data) return [];

  return data.map((row) => {
    let mama = row.mama_time_ms || 0;
    let papa = row.papa_time_ms || 0;

    // Add elapsed for today's active timer
    const today = new Date().toISOString().split("T")[0];
    if (row.date === today && row.active_parent && row.last_switch_at) {
      const elapsed = Date.now() - new Date(row.last_switch_at).getTime();
      if (row.active_parent === "mama") mama += elapsed;
      else papa += elapsed;
    }

    return {
      date: row.date,
      mama,
      papa,
      total: mama + papa,
    };
  });
}

export function aggregateStats(days) {
  const totalMama = days.reduce((sum, d) => sum + d.mama, 0);
  const totalPapa = days.reduce((sum, d) => sum + d.papa, 0);
  const total = totalMama + totalPapa;

  return {
    totalMama,
    totalPapa,
    total,
    mamaPercent: total > 0 ? (totalMama / total) * 100 : 50,
    papaPercent: total > 0 ? (totalPapa / total) * 100 : 50,
    daysTracked: days.length,
  };
}
