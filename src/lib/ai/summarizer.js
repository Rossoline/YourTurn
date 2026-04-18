import { anthropic } from "./client";
import { MODEL } from "./config";
import { systemPrompts } from "./prompts";
import { logUsage } from "./middleware";

function formatMessagesForSummary(messages) {
  return messages
    .map((m) => {
      const role = m.role === "user" ? "Користувач" : "Асистент";
      const text = typeof m.content === "string"
        ? m.content
        : JSON.stringify(m.content);
      return `${role}: ${text}`;
    })
    .join("\n\n");
}

export async function summarizeMessages(messages, logContext) {
  if (!messages.length) return null;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: systemPrompts.SUMMARIZER,
    messages: [
      {
        role: "user",
        content: `Ось історія чату, яку треба підсумувати:\n\n${formatMessagesForSummary(messages)}`,
      },
    ],
  });

  logUsage({
    userId: logContext?.userId,
    familyId: logContext?.familyId,
    usage: response.usage,
    stopReason: `summarize:${response.stop_reason}`,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : null;
}
