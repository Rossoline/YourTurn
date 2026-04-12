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

export async function updateParticipant(supabase, id, updates) {
  const { error } = await supabase
    .from("participants")
    .update(updates)
    .eq("id", id);

  return { error: error ? "Не вдалося оновити" : null };
}

export async function toggleParticipant(supabase, id, isActive) {
  return updateParticipant(supabase, id, { is_active: isActive });
}

export async function deleteParticipant(supabase, id) {
  const { error } = await supabase
    .from("participants")
    .delete()
    .eq("id", id);

  return { error: error ? "Не вдалося видалити" : null };
}
