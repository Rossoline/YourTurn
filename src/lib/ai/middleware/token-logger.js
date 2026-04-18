import { MODEL } from "../config";

// Approximate pricing per 1M tokens for claude-haiku-4-5.
// Kept inline here — update alongside config when switching models.
const PRICING = {
  "claude-haiku-4-5-20251001": {
    input: 1.0,
    cacheWrite: 1.25,
    cacheRead: 0.1,
    output: 5.0,
  },
};

function estimateCost(usage, model) {
  const p = PRICING[model];
  if (!p) return null;

  const input = usage.input_tokens || 0;
  const cacheWrite = usage.cache_creation_input_tokens || 0;
  const cacheRead = usage.cache_read_input_tokens || 0;
  const output = usage.output_tokens || 0;

  const cost =
    (input * p.input +
      cacheWrite * p.cacheWrite +
      cacheRead * p.cacheRead +
      output * p.output) /
    1_000_000;

  return Number(cost.toFixed(6));
}

export function logUsage({ userId, familyId, usage, stopReason }) {
  if (!usage) return;

  const cost = estimateCost(usage, MODEL);

  console.log("[ai.usage]", {
    userId,
    familyId,
    model: MODEL,
    stopReason,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheWrite: usage.cache_creation_input_tokens || 0,
    cacheRead: usage.cache_read_input_tokens || 0,
    estimatedCostUsd: cost,
    timestamp: new Date().toISOString(),
  });
}
