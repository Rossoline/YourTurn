import { systemPrompts } from "./prompts";

export const MODEL = "claude-haiku-4-5-20251001";
export const MAX_TOKENS = 256;

// Keep last N messages verbatim. Older ones get absorbed into the summary.
export const RECENT_WINDOW = 10;

// Start summarizing once total history exceeds this length.
export const SUMMARIZE_THRESHOLD = 20;

// Refresh the cached summary after this many new messages drift past it.
// Keeps summary generation costs amortized instead of per-request.
export const REFRESH_EVERY = 20;

export function buildSystemMessage(summary) {
  const parts = [
    {
      type: "text",
      text: systemPrompts.CHAT_ASSISTANT,
      cache_control: { type: "ephemeral" },
    },
  ];

  if (summary) {
    parts.push({
      type: "text",
      text: `Підсумок попередньої розмови:\n${summary}`,
    });
  }

  return parts;
}
