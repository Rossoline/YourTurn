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
  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      family_id: familyId,
      participant_id: participantId,
      title,
      date,
      start_time: startTime,
      end_time: endTime,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEvent(supabase, eventId, updates) {
  const mapped = {};
  if (updates.title !== undefined) mapped.title = updates.title;
  if (updates.participantId !== undefined) mapped.participant_id = updates.participantId;
  if (updates.date !== undefined) mapped.date = updates.date;
  if (updates.startTime !== undefined) mapped.start_time = updates.startTime;
  if (updates.endTime !== undefined) mapped.end_time = updates.endTime;

  const { error } = await supabase
    .from("calendar_events")
    .update(mapped)
    .eq("id", eventId);

  if (error) throw error;
}

export async function deleteEvent(supabase, eventId) {
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId);

  if (error) throw error;
}
