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

    const { userMessage, conversationHistory, familyId } = await request.json();

    if (!familyId || !userMessage) return jsonError("Missing required fields", 400);

    const { data: familyMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (!familyMember) return jsonError("Family access denied", 403);

    const message = await runChatAgent({
      supabase,
      userId: user.id,
      familyId,
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
