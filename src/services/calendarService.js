export async function getEventsForMonth(supabase, familyId, year, month) {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data } = await supabase
    .from("calendar_events")
    .select("id, participant_id, title, date, start_time, end_time, created_by")
    .eq("family_id", familyId)
    .gte("date", from)
    .lte("date", to)
    .order("start_time", { ascending: true });

  return data || [];
}

export async function getEventsForDate(supabase, familyId, date) {
  const { data } = await supabase
    .from("calendar_events")
    .select("id, participant_id, title, date, start_time, end_time, created_by")
    .eq("family_id", familyId)
    .eq("date", date)
    .order("start_time", { ascending: true });

  return data || [];
}

export async function createEvent(supabase, { familyId, participantId, title, date, startTime, endTime, userId }) {
  if (!title?.trim()) return { error: "Вкажіть назву події" };
  if (!date) return { error: "Вкажіть дату" };
  if (!startTime || !endTime) return { error: "Вкажіть час початку і кінця" };
  if (startTime >= endTime) return { error: "Час початку має бути раніше за кінець" };
  if (!userId) return { error: "Користувач не авторизований" };

  if (participantId) {
    const { data: p } = await supabase
      .from("participants")
      .select("id")
      .eq("id", participantId)
      .eq("family_id", familyId)
      .maybeSingle();
    if (!p) return { error: "Учасник не належить до цієї сім'ї" };
  }

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      family_id: familyId,
      participant_id: participantId || null,
      title: title.trim(),
      date,
      start_time: startTime,
      end_time: endTime,
      created_by: userId,
    })
    .select()
    .single();

  if (error) return { error: "Не вдалося створити подію" };
  return { event: data };
}

export async function updateEvent(supabase, eventId, updates, familyId = null) {
  const mapped = {};
  if (updates.title !== undefined) mapped.title = updates.title.trim();
  if (updates.participantId !== undefined) mapped.participant_id = updates.participantId;
  if (updates.date !== undefined) mapped.date = updates.date;
  if (updates.startTime !== undefined) mapped.start_time = updates.startTime;
  if (updates.endTime !== undefined) mapped.end_time = updates.endTime;

  const query = supabase.from("calendar_events").update(mapped).eq("id", eventId);
  if (familyId) query.eq("family_id", familyId);

  const { error } = await query;
  return { error: error ? "Не вдалося оновити подію" : null };
}

export async function deleteEvent(supabase, eventId, familyId = null) {
  const query = supabase.from("calendar_events").delete().eq("id", eventId);
  if (familyId) query.eq("family_id", familyId);

  const { error } = await query;
  return { error: error ? "Не вдалося видалити подію" : null };
}
