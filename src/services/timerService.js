import { todayDate } from "@/utils/format";

export async function loadTimerState(supabase, familyId) {
  const today = todayDate();

  const [{ data: state }, { data: entries }] = await Promise.all([
    supabase
      .from("timer_state")
      .select("*")
      .eq("family_id", familyId)
      .eq("date", today)
      .maybeSingle(),
    supabase
      .from("timer_entries")
      .select("participant_id, time_ms")
      .eq("family_id", familyId)
      .eq("date", today),
  ]);

  const times = {};
  if (entries) {
    for (const e of entries) {
      times[e.participant_id] = e.time_ms || 0;
    }
  }

  if (state?.active_participant_id && state?.last_switch_at) {
    const elapsed = Date.now() - new Date(state.last_switch_at).getTime();
    const pid = state.active_participant_id;
    times[pid] = (times[pid] || 0) + elapsed;
  }

  return {
    activeParticipantId: state?.active_participant_id || null,
    lastSwitchAt: state?.last_switch_at || null,
    version: state?.version || 0,
    times,
  };
}

export async function saveTimerState(supabase, { familyId, activeParticipantId, previousParticipantId, times, expectedVersion }) {
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

  // Upsert timer_state
  const statePayload = {
    active_participant_id: activeParticipantId,
    last_switch_at: activeParticipantId ? now : null,
    updated_at: now,
    version: newVersion,
  };

  if (existing) {
    const { error } = await supabase
      .from("timer_state")
      .update(statePayload)
      .eq("family_id", familyId)
      .eq("date", today)
      .eq("version", expectedVersion);

    if (error) return { conflict: true };
  } else {
    const { error } = await supabase
      .from("timer_state")
      .insert({ family_id: familyId, date: today, ...statePayload });

    if (error) return { conflict: true };
  }

  // Upsert timer_entries
  const entries = Object.entries(times).map(([participantId, timeMs]) => ({
    family_id: familyId,
    participant_id: participantId,
    date: today,
    time_ms: timeMs,
  }));

  if (entries.length > 0) {
    await supabase
      .from("timer_entries")
      .upsert(entries, { onConflict: "family_id,participant_id,date" });
  }

  // Close previous session
  if (previousParticipantId) {
    await supabase
      .from("timer_sessions")
      .update({ ended_at: now, duration_ms: times[previousParticipantId] || 0 })
      .eq("family_id", familyId)
      .eq("participant_id", previousParticipantId)
      .is("ended_at", null);
  }

  // Open new session
  if (activeParticipantId) {
    await supabase
      .from("timer_sessions")
      .insert({
        family_id: familyId,
        participant_id: activeParticipantId,
        date: today,
        started_at: now,
      });
  }

  return { version: newVersion };
}

export async function getTodaySessions(supabase, familyId) {
  const today = todayDate();

  const { data } = await supabase
    .from("timer_sessions")
    .select("participant_id, started_at, ended_at")
    .eq("family_id", familyId)
    .eq("date", today)
    .order("started_at", { ascending: true });

  return data || [];
}

export function subscribeToTimer(supabase, familyId, onUpdate) {
  const channel = supabase
    .channel(`timer_${familyId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "timer_state", filter: `family_id=eq.${familyId}` },
      () => onUpdate()
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "timer_entries", filter: `family_id=eq.${familyId}` },
      () => onUpdate()
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
