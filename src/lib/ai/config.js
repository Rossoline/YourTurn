import { systemPrompts } from "./prompts";

export const MODEL = "claude-haiku-4-5-20251001";
export const MAX_TOKENS = 256;

// Keep last N messages verbatim. Older ones are summarized.
export const RECENT_WINDOW = 10;

// Summarize older messages once history exceeds this length.
export const SUMMARIZE_THRESHOLD = 20;

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
