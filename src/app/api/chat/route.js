import { createClient } from "@/lib/supabase/server";
import { runChatAgent } from "@/lib/chat-agent";

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return jsonError("Unauthorized", 401);

    const { userMessage, conversationHistory, familyId } = await request.json();

    if (!familyId || !userMessage) return jsonError("Missing required fields", 400);

    const { data: familyMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (!familyMember) return jsonError("Family access denied", 403);

    const message = await runChatAgent(supabase, familyId, userMessage, conversationHistory);

    return new Response(JSON.stringify({ message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return jsonError("Internal server error", 500);
  }
}
