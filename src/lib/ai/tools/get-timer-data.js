export const definition = {
  name: "get_timer_data",
  description: "Отримати поточні дані про витрачений час з таймера",
  input_schema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export async function execute({ supabase, familyId }) {
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

  if (!entries?.length || !participants?.length) {
    return "Дані з таймера ще не збережені на сьогодні.";
  }

  const lines = participants.map((p) => {
    const entry = entries.find((e) => e.participant_id === p.id);
    const timeMs = entry ? entry.time_ms : 0;
    const hours = Math.floor(timeMs / 3600000);
    const minutes = Math.floor((timeMs % 3600000) / 60000);
    return `${p.name}: ${hours}h ${minutes}m`;
  });

  return `Дані таймера на сьогодні:\n${lines.join("\n")}`;
}
