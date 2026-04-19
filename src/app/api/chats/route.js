import { createClient } from "@/lib/supabase/server";

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// GET /api/chats?familyId=... — list user's chats in a family
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get("familyId");
    if (!familyId) return jsonError("Missing familyId", 400);

    const { data, error } = await supabase
      .from("chats")
      .select("id, name, created_at")
      .eq("user_id", user.id)
      .eq("family_id", familyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return json({ chats: data || [] });
  } catch (error) {
    console.error("GET /api/chats error:", error);
    return jsonError("Internal server error", 500);
  }
}

// POST /api/chats — create a new chat
export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { familyId } = await request.json();
    if (!familyId) return jsonError("Missing familyId", 400);

    const { data: member } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (!member) return jsonError("Family access denied", 403);

    const { data, error } = await supabase
      .from("chats")
      .insert({ user_id: user.id, family_id: familyId, name: "Новий чат" })
      .select()
      .single();

    if (error) throw error;
    return json({ chat: data }, 201);
  } catch (error) {
    console.error("POST /api/chats error:", error);
    return jsonError("Internal server error", 500);
  }
}
