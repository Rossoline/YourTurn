import { todayDate } from "@/utils/format";

export async function loadTimerState(supabase, familyId) {
  const { data } = await supabase
    .from("timer_state")
    .select("*")
    .eq("family_id", familyId)
    .eq("date", todayDate())
    .maybeSingle();

  return data;
}

export async function saveTimerState(supabase, { familyId, activeParent, mamaTime, papaTime, expectedVersion }) {
  const today = todayDate();
  const now = new Date().toISOString();
  const newVersion = expectedVersion + 1;

  const { data: existing } = await supabase
    .from("timer_state")
    .select("version")
    .eq("family_id", familyId)
    .eq("date", today)
    .maybeSingle();

  if (existing && (existing.version || 0) !== expectedVersion) {
    return { conflict: true };
  }

  const payload = {
    active_parent: activeParent,
    mama_time_ms: mamaTime,
    papa_time_ms: papaTime,
    last_switch_at: activeParent ? now : null,
    updated_at: now,
    version: newVersion,
  };

  if (existing) {
    const { error } = await supabase
      .from("timer_state")
      .update(payload)
      .eq("family_id", familyId)
      .eq("date", today)
      .eq("version", expectedVersion);

    if (error) return { conflict: true };
  } else {
    const { error } = await supabase
      .from("timer_state")
      .insert({ family_id: familyId, date: today, ...payload });

    if (error) return { conflict: true };
  }

  return { version: newVersion };
}

export function subscribeToTimer(supabase, familyId, onUpdate) {
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
        if (payload.new) onUpdate(payload.new);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
