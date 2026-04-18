export async function getSummary(supabase, familyId) {
  const { data } = await supabase
    .from("chat_summaries")
    .select("summary, summarized_count")
    .eq("family_id", familyId)
    .maybeSingle();

  return data ? { summary: data.summary, summarizedCount: data.summarized_count } : null;
}

export async function saveSummary(supabase, familyId, summary, summarizedCount) {
  await supabase
    .from("chat_summaries")
    .upsert(
      {
        family_id: familyId,
        summary,
        summarized_count: summarizedCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "family_id" }
    );
}
