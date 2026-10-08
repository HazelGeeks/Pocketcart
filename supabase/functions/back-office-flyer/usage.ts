export type FlyerAiUsage = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedInputTokens: number;
  cacheWriteInputTokens: number;
  reasoningTokens: number;
  estimatedCostUsd: number | null;
};

export type OpenAiUsage = {
  input_tokens?: number;
  output_tokens?: number;
  input_tokens_details?: { cached_tokens?: number; cache_write_tokens?: number };
  output_tokens_details?: { reasoning_tokens?: number };
};

function tokenCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

// Standard USD rates checked 2026-10-08:
// https://developers.openai.com/api/docs/models/gpt-6-luna
// Cache reads/writes are subsets of input; reasoning is a subset of output.
export function flyerAiUsage(
  raw: OpenAiUsage | undefined,
  model: string,
  serviceTier?: string,
): FlyerAiUsage | undefined {
  if (!raw || !tokenCount(raw.input_tokens) || !tokenCount(raw.output_tokens)) return undefined;
  const inputTokens = raw.input_tokens;
  const outputTokens = raw.output_tokens;
  const cachedInputTokens = raw.input_tokens_details?.cached_tokens ?? 0;
  const cacheWriteInputTokens = raw.input_tokens_details?.cache_write_tokens ?? 0;
  const reasoningTokens = raw.output_tokens_details?.reasoning_tokens ?? 0;
  if (![cachedInputTokens, cacheWriteInputTokens, reasoningTokens].every(tokenCount) ||
      cachedInputTokens + cacheWriteInputTokens > inputTokens || reasoningTokens > outputTokens) {
    return undefined;
  }
  const tierMultiplier = serviceTier === "flex" || serviceTier === "batch" ? 0.5
    : serviceTier === "fast" || serviceTier === "priority" ? 2
    : !serviceTier || ["auto", "default", "standard"].includes(serviceTier) ? 1 : null;
  const longContext = inputTokens > 272_000;
  const ordinaryInputTokens = inputTokens - cachedInputTokens - cacheWriteInputTokens;
  const estimatedCostUsd = model === "gpt-6-luna" && tierMultiplier !== null
    ? ((ordinaryInputTokens * 0.10 + cachedInputTokens * 0.01 + cacheWriteInputTokens * 0.125) *
        (longContext ? 2 : 1) + outputTokens * 0.50 * (longContext ? 1.5 : 1)) * tierMultiplier / 1_000_000
    : null;
  return {
    model, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens,
    cachedInputTokens, cacheWriteInputTokens, reasoningTokens, estimatedCostUsd,
  };
}
