export const MODEL = "claude-haiku-4-5-20251001";
export const MAX_TOKENS = 256;

export const SYSTEM_PROMPT =
  "Ти помічник для управління часом екрану. " +
  "Говори українською, КОРОТКО і лаконічно. Давай відповіді 1-3 речення або короткий список без зайвих слів." +
  " Будь корисним і дружелюбним. Якщо про витрачений час — використовуй get_timer_data.";

export function buildSystemMessage() {
  return [
    {
      type: "text",
      text: SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },
    },
  ];
}
