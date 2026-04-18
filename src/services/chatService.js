// Fetch chat messages from database
export async function getChatMessages(supabase, familyId) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Save message to database
export async function saveChatMessage(supabase, familyId, userId, role, content) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert([{ family_id: familyId, user_id: userId, role, content }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Call Claude API via backend endpoint
export async function chatWithClaude(familyId, userMessage, conversationHistory) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      familyId,
      userMessage,
      conversationHistory,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get response");
  }

  const { message } = await response.json();
  return message;
}
