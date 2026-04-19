// --- Chat list management ---

export async function getChats(supabase, familyId) {
  const { data, error } = await supabase
    .from("chats")
    .select("id, name, created_at")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createChat(familyId) {
  const response = await fetch("/api/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ familyId }),
  });
  if (!response.ok) throw new Error("Failed to create chat");
  const { chat } = await response.json();
  return chat;
}

export async function renameChat(chatId, name) {
  const response = await fetch(`/api/chats/${chatId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error("Failed to rename chat");
}

export async function deleteChat(chatId) {
  const response = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete chat");
}

// --- Messages ---

export async function getChatMessages(supabase, chatId) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function saveChatMessage(supabase, chatId, userId, role, content) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert([{ chat_id: chatId, user_id: userId, role, content }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// --- AI ---

export async function chatWithClaude(chatId, familyId, userMessage, conversationHistory) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, familyId, userMessage, conversationHistory }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get response");
  }

  const { message } = await response.json();
  return message;
}
