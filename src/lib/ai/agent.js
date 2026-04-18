import { anthropic } from "./client";
import { MODEL, MAX_TOKENS, buildSystemMessage } from "./config";
import { toolDefinitions, executeTool } from "./tools";
import { logUsage } from "./middleware";

async function callModel(messages, logContext) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSystemMessage(),
    messages,
    tools: toolDefinitions,
  });

  logUsage({
    userId: logContext.userId,
    familyId: logContext.familyId,
    usage: response.usage,
    stopReason: response.stop_reason,
  });

  return response;
}

async function handleToolUse(response, messages, context) {
  const toolUseBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolUseBlock) return null;

  const result = await executeTool(toolUseBlock.name, context);

  messages.push({ role: "assistant", content: response.content });
  messages.push({
    role: "user",
    content: [
      {
        type: "tool_result",
        tool_use_id: toolUseBlock.id,
        content: result,
      },
    ],
  });

  return callModel(messages, context);
}

export async function runChatAgent({ supabase, userId, familyId, userMessage, conversationHistory }) {
  const messages = conversationHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  messages.push({ role: "user", content: userMessage });

  const context = { supabase, userId, familyId };
  let response = await callModel(messages, context);

  while (response.stop_reason === "tool_use") {
    const next = await handleToolUse(response, messages, context);
    if (!next) break;
    response = next;
  }

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "Вибачте, відбулася помилка.";
}
