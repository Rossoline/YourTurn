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

// PATCH /api/chats/[id] — rename chat
export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { name } = await request.json();
    if (!name?.trim()) return jsonError("Missing name", 400);

    const { error } = await supabase
      .from("chats")
      .update({ name: name.trim() })
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/chats/[id] error:", error);
    return jsonError("Internal server error", 500);
  }
}

// DELETE /api/chats/[id] — delete chat and all its messages (cascade)
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const { error } = await supabase
      .from("chats")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/chats/[id] error:", error);
    return jsonError("Internal server error", 500);
  }
}
