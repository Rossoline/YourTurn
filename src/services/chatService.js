import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
});

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

// Get timer data for the AI agent
export async function getTimerDataForAgent(supabase, familyId) {
  const today = new Date().toISOString().split("T")[0];

  const { data: entries, error: entriesError } = await supabase
    .from("timer_entries")
    .select("participant_id, time_ms")
    .eq("family_id", familyId)
    .eq("date", today);

  if (entriesError) throw entriesError;

  const { data: participants, error: participantError } = await supabase
    .from("participants")
    .select("id, name")
    .eq("family_id", familyId)
    .eq("is_active", true);

  if (participantError) throw participantError;

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

// Call Claude API with tool use
export async function chatWithClaude(supabase, familyId, userId, userMessage, conversationHistory) {
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
    system: `Ти помічник для сімейної програми відстеження часу екрану. Твоя роль — допомагати користувачам відповідями на запитання про управління часом і навички добре користуватися інтернетом. Говори українською мовою. Будь дружелюбним, позитивним і захоплюючим. Якщо користувач запитує про витрачений час або статистику, використовуй функцію get_timer_data.`,
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
        system: `Ти помічник для сімейної програми відстеження часу екрану. Твоя роль — допомагати користувачам відповідями на запитання про управління часом і навички добре користуватися інтернетом. Говори українською мовою. Будь дружелюбним, позитивним і захоплюючим.`,
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

  return assistantMessage;
}
