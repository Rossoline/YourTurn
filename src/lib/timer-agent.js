export async function getTimerDataForAgent(supabase, familyId) {
  const today = new Date().toISOString().split("T")[0];

  const { data: entries } = await supabase
    .from("timer_entries")
    .select("participant_id, time_ms")
    .eq("family_id", familyId)
    .eq("date", today);

  const { data: participants } = await supabase
    .from("participants")
    .select("id, name")
    .eq("family_id", familyId)
    .eq("is_active", true);

  let summary = "Дані таймера на сьогодні:\n";
  if (entries && entries.length > 0 && participants) {
    participants.forEach((p) => {
      const entry = entries.find((e) => e.participant_id === p.id);
      const timeMs = entry ? entry.time_ms : 0;
      const hours = Math.floor(timeMs / 3600000);
      const minutes = Math.floor((timeMs % 3600000) / 60000);
      summary += `${p.name}: ${hours}h ${minutes}m\n`;
    });
  } else {
    summary += "Дані з таймера ще не збережені на сьогодні.";
  }

  return summary;
}
