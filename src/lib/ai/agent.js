import { anthropic } from "./client";
import {
  MODEL,
  MAX_TOKENS,
  RECENT_WINDOW,
  SUMMARIZE_THRESHOLD,
  buildSystemMessage,
} from "./config";
import { toolDefinitions, executeTool } from "./tools";
import { logUsage } from "./middleware";
import { summarizeMessages } from "./summarizer";

// Normalize history to Claude message shape.
function normalize(history) {
  return history.map((msg) => ({ role: msg.role, content: msg.content }));
}

// Mark the last history message with cache_control so everything up to
// and including it becomes cacheable on subsequent requests.
function withHistoryCache(historyMessages) {
  if (!historyMessages.length) return historyMessages;

  return historyMessages.map((msg, idx) => {
    if (idx !== historyMessages.length - 1) return msg;

    const contentBlocks = typeof msg.content === "string"
      ? [{ type: "text", text: msg.content }]
      : msg.content;

    const marked = contentBlocks.map((block, i) =>
      i === contentBlocks.length - 1
        ? { ...block, cache_control: { type: "ephemeral" } }
        : block
    );

    return { ...msg, content: marked };
  });
}

// Split history into (summary_source, recent) when it grows past threshold.
async function compressHistory(history, context) {
  if (history.length <= SUMMARIZE_THRESHOLD) {
    return { summary: null, recent: history };
  }

  const cutoff = history.length - RECENT_WINDOW;
  const toSummarize = history.slice(0, cutoff);
  const recent = history.slice(cutoff);

  const summary = await summarizeMessages(toSummarize, context);
  return { summary, recent };
}

async function callModel({ messages, summary, logContext }) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSystemMessage(summary),
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

async function handleToolUse(response, messages, context, summary) {
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

  return callModel({ messages, summary, logContext: context });
}

export async function runChatAgent({
  supabase,
  userId,
  familyId,
  userMessage,
  conversationHistory,
}) {
  const context = { supabase, userId, familyId };

  const history = normalize(conversationHistory);
  const { summary, recent } = await compressHistory(history, context);

  const cachedHistory = withHistoryCache(recent);
  const messages = [...cachedHistory, { role: "user", content: userMessage }];

  let response = await callModel({ messages, summary, logContext: context });

  while (response.stop_reason === "tool_use") {
    const next = await handleToolUse(response, messages, context, summary);
    if (!next) break;
    response = next;
  }

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "Вибачте, відбулася помилка.";
}
