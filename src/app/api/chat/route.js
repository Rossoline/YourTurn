import { createClient } from "@/lib/supabase/server";
import { runChatAgent } from "@/lib/ai/agent";
import { checkAiRateLimit } from "@/lib/ai/middleware";

function jsonError(message, status, extraHeaders = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const limit = checkAiRateLimit(user.id);
    if (!limit.allowed) {
      return jsonError("Too many requests", 429, {
        "Retry-After": String(Math.ceil(limit.retryAfter / 1000)),
      });
    }

    const { chatId, familyId, userMessage, conversationHistory } = await request.json();
    if (!chatId || !familyId || !userMessage) return jsonError("Missing required fields", 400);

    // Verify the chat belongs to this user
    const { data: chat } = await supabase
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single();

    if (!chat) return jsonError("Chat not found or access denied", 403);

    const message = await runChatAgent({
      supabase,
      userId: user.id,
      familyId,
      chatId,
      userMessage,
      conversationHistory,
    });

    return new Response(JSON.stringify({ message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return jsonError("Internal server error", 500);
  }
}
