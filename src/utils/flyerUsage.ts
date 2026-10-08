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

export function normalizeFlyerUsage(value: unknown): FlyerAiUsage | null | undefined {
  if (value === null) return null; // Server explicitly reports no OpenAI call.
  if (!value || typeof value !== "object") return undefined;
  const usage = value as FlyerAiUsage;
  const counts = [usage.inputTokens, usage.outputTokens, usage.totalTokens,
    usage.cachedInputTokens, usage.cacheWriteInputTokens, usage.reasoningTokens];
  if (typeof usage.model !== "string" || !usage.model ||
      !counts.every((count) => Number.isSafeInteger(count) && count >= 0) ||
      usage.totalTokens !== usage.inputTokens + usage.outputTokens ||
      usage.cachedInputTokens + usage.cacheWriteInputTokens > usage.inputTokens ||
      usage.reasoningTokens > usage.outputTokens) return undefined;
  return {
    model: usage.model, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens, cachedInputTokens: usage.cachedInputTokens,
    cacheWriteInputTokens: usage.cacheWriteInputTokens, reasoningTokens: usage.reasoningTokens,
    estimatedCostUsd: typeof usage.estimatedCostUsd === "number" &&
      Number.isFinite(usage.estimatedCostUsd) && usage.estimatedCostUsd >= 0 ? usage.estimatedCostUsd : null,
  };
}

export function flyerUsageFromError(error: unknown) {
  return normalizeFlyerUsage(error && typeof error === "object" && "usage" in error ? error.usage : undefined);
}

export function summarizeFlyerUsage(usages: Array<FlyerAiUsage | null | undefined>) {
  const reported = usages.filter((usage): usage is FlyerAiUsage => Boolean(usage));
  const unknownFiles = usages.filter((usage) => usage === undefined).length;
  const sum = (key: "inputTokens" | "outputTokens" | "totalTokens") =>
    reported.reduce((total, usage) => total + usage[key], 0);
  return {
    inputTokens: sum("inputTokens"), outputTokens: sum("outputTokens"), totalTokens: sum("totalTokens"),
    models: [...new Set(reported.map((usage) => usage.model))],
    unknownFiles,
    reportedFiles: usages.length - unknownFiles,
    estimatedCostUsd: reported.some((usage) => usage.estimatedCostUsd === null) ? null
      : reported.reduce((total, usage) => total + (usage.estimatedCostUsd ?? 0), 0),
  };
}

export function formatFlyerUsageSummary(usage: ReturnType<typeof summarizeFlyerUsage>) {
  if (!usage.reportedFiles) return "OpenAI usage and estimated cost unavailable.";
  const number = (value: number) => value.toLocaleString("en-US");
  const cost = usage.estimatedCostUsd === null ? "Est. cost unavailable"
    : `Est. USD $${usage.estimatedCostUsd.toFixed(6)}`;
  const partial = usage.unknownFiles ? ` Partial usage; ${usage.unknownFiles} file(s) unreported.` : "";
  return `OpenAI${usage.models.length ? ` (${usage.models.join(", ")})` : ""}: ${number(usage.totalTokens)} tokens ` +
    `(input ${number(usage.inputTokens)} / output ${number(usage.outputTokens)}) · ${cost}.${partial} Google Vision OCR excluded.`;
}
