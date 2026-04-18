import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = "Ти помічник для сімейної програми відстеження часу екрану. Твоя роль — допомагати користувачам відповідями на запитання про управління часом і навички добре користуватися інтернетом. Говори українською мовою. Будь дружелюбним, позитивним і захоплюючим. Якщо користувач запитує про витрачений час або статистику, використовуй функцію get_timer_data.";

async function getTimerDataForAgent(supabase, familyId) {
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

  let summary = "Дані таймера на сьогодні:\n";
  if (entries && entries.length > 0 && participants) {
    participants.forEach((p) => {
      const entry = entries.find((e) => e.participant_id === p.id);
      const timeMs = entry ? entry.time_ms : 0;
      const hours = Math.floor(timeMs / 3600000);
      const minutes = Math.floor((timeMs % 3600000) / 60000);
      summary += `${p.name}: ${hours}h ${minutes}m\n`;
    });
  } else {
    summary += "Дані з таймера ще не збережені на сьогодні.";
  }

  return summary;
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userMessage, conversationHistory, familyId } = await request.json();

    if (!familyId || !userMessage) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify user has access to this family
    const { data: familyMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (!familyMember) {
      return new Response(JSON.stringify({ error: "Family access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Format conversation for Claude
    const messages = conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    messages.push({
      role: "user",
      content: userMessage,
    });

    // Define tools for Claude
    const tools = [
      {
        name: "get_timer_data",
        description: "Отримати поточні дані про витрачений час з таймера",
        input_schema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    ];

    let response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
      tools,
    });

    // Handle tool use in a loop
    while (response.stop_reason === "tool_use") {
      const toolUseBlock = response.content.find((block) => block.type === "tool_use");

      if (toolUseBlock && toolUseBlock.name === "get_timer_data") {
        const timerData = await getTimerDataForAgent(supabase, familyId);

        // Continue conversation with tool result
        messages.push({
          role: "assistant",
          content: response.content,
        });

        messages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: toolUseBlock.id,
              content: timerData,
            },
          ],
        });

        response = await client.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages,
          tools,
        });
      } else {
        break;
      }
    }

    // Extract final text response
    const textBlock = response.content.find((block) => block.type === "text");
    const assistantMessage = textBlock ? textBlock.text : "Вибачте, відбулася помилка.";

    return new Response(JSON.stringify({ message: assistantMessage }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
