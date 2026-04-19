export async function getSummary(supabase, chatId) {
  const { data } = await supabase
    .from("chat_summaries")
    .select("summary, summarized_count")
    .eq("chat_id", chatId)
    .maybeSingle();

  return data ? { summary: data.summary, summarizedCount: data.summarized_count } : null;
}

export async function saveSummary(supabase, chatId, summary, summarizedCount) {
  await supabase
    .from("chat_summaries")
    .upsert(
      {
        chat_id: chatId,
        summary,
        summarized_count: summarizedCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "chat_id" }
    );
}
