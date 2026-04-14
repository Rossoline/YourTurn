import { PALETTE } from "@/utils/colors";

export async function getParticipants(supabase, familyId) {
  const { data } = await supabase
    .from("participants")
    .select("*")
    .eq("family_id", familyId)
    .order("sort_order")
    .order("created_at");

  return data || [];
}

export async function addParticipant(supabase, { familyId, name, color }) {
  if (!familyId) return { error: "Сім'я не знайдена" };
  if (!name?.trim()) return { error: "Вкажіть ім'я учасника" };

  // Auto-pick color if not specified
  if (!color) {
    const existing = await getParticipants(supabase, familyId);
    const usedColors = existing.map((p) => p.color);
    const available = PALETTE.find((c) => !usedColors.includes(c.key));
    color = available ? available.key : PALETTE[existing.length % PALETTE.length].key;
  }

  const { data, error } = await supabase
    .from("participants")
    .insert({ family_id: familyId, name, color })
    .select()
    .single();

  if (error) return { error: "Не вдалося додати учасника" };
  return { participant: data };
}

export async function updateParticipant(supabase, id, updates, familyId = null) {
  const query = supabase.from("participants").update(updates).eq("id", id);
  if (familyId) query.eq("family_id", familyId);

  const { error } = await query;
  return { error: error ? "Не вдалося оновити" : null };
}

export async function toggleParticipant(supabase, id, isActive) {
  return updateParticipant(supabase, id, { is_active: isActive });
}

export async function deleteParticipant(supabase, id, familyId = null) {
  // Clean up related data before deleting
  await Promise.all([
    supabase.from("timer_entries").delete().eq("participant_id", id),
    supabase.from("timer_sessions").delete().eq("participant_id", id),
    supabase.from("calendar_events").delete().eq("participant_id", id),
  ]);

  const query = supabase.from("participants").delete().eq("id", id);
  if (familyId) query.eq("family_id", familyId);

  const { error } = await query;
  return { error: error ? "Не вдалося видалити" : null };
}
