import { client, CLAUDE_MODEL, MAX_TOKENS, CHAT_TOOLS, buildSystemMessage } from "@/lib/claude";
import { getTimerDataForAgent } from "@/lib/timer-agent";

async function callClaude(messages) {
  return client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSystemMessage(),
    messages,
    tools: CHAT_TOOLS,
  });
}

async function handleToolUse(response, messages, supabase, familyId) {
  const toolUseBlock = response.content.find((block) => block.type === "tool_use");
  if (!toolUseBlock) return null;

  let toolResult;
  if (toolUseBlock.name === "get_timer_data") {
    toolResult = await getTimerDataForAgent(supabase, familyId);
  } else {
    return null;
  }

  messages.push({ role: "assistant", content: response.content });
  messages.push({
    role: "user",
    content: [
      {
        type: "tool_result",
        tool_use_id: toolUseBlock.id,
        content: toolResult,
      },
    ],
  });

  return callClaude(messages);
}

export async function runChatAgent(supabase, familyId, userMessage, conversationHistory) {
  const messages = conversationHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  messages.push({ role: "user", content: userMessage });

  let response = await callClaude(messages);

  while (response.stop_reason === "tool_use") {
    const next = await handleToolUse(response, messages, supabase, familyId);
    if (!next) break;
    response = next;
  }

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "Вибачте, відбулася помилка.";
}
