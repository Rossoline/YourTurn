import { systemPrompts } from "./prompts";

export const MODEL = "claude-haiku-4-5-20251001";
export const MAX_TOKENS = 256;

export function buildSystemMessage() {
  return [
    {
      type: "text",
      text: systemPrompts.CHAT_ASSISTANT,
      cache_control: { type: "ephemeral" },
    },
  ];
}
