export async function getUserFamily(supabase, userId) {
  const { data } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function createFamily(supabase, { name, userId, role }) {
  if (!name?.trim()) return { error: "Вкажіть назву сім'ї" };
  if (!userId) return { error: "Користувач не авторизований" };
  if (!role?.trim()) return { error: "Вкажіть роль" };
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const code = Array.from(bytes, (b) => b.toString(36)).join("").substring(0, 6).toUpperCase();

  const { data: family, error: famErr } = await supabase
    .from("families")
    .insert({ name, invite_code: code })
    .select()
    .single();

  if (famErr) return { error: "Не вдалося створити сім'ю" };

  const { error: memErr } = await supabase
    .from("family_members")
    .insert({ family_id: family.id, user_id: userId, role });

  if (memErr) return { error: "Не вдалося додати вас до сім'ї" };

  return { familyId: family.id, inviteCode: code };
}

export async function joinFamily(supabase, { inviteCode, userId, role }) {
  if (!inviteCode?.trim()) return { error: "Вкажіть код запрошення" };
  if (!userId) return { error: "Користувач не авторизований" };
  if (!role?.trim()) return { error: "Вкажіть роль" };

  const { data: family } = await supabase
    .from("families")
    .select("id")
    .eq("invite_code", inviteCode.trim().toUpperCase())
    .single();

  if (!family) return { error: "Сім'ю з таким кодом не знайдено" };

  const { data: existing } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", family.id)
    .eq("role", role)
    .maybeSingle();

  if (existing) {
    const label = role === "mama" ? "Мама" : "Тато";
    return { error: `Роль "${label}" вже зайнята в цій сім'ї` };
  }

  const { error: memErr } = await supabase
    .from("family_members")
    .insert({ family_id: family.id, user_id: userId, role });

  if (memErr) return { error: "Не вдалося приєднатися" };

  return { familyId: family.id };
}

export async function getFamilyInviteCode(supabase, familyId) {
  const { data } = await supabase
    .from("families")
    .select("invite_code")
    .eq("id", familyId)
    .single();

  return data?.invite_code;
}
