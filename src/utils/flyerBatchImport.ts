import type { FlyerRow } from "../state/adminStore";
import { flyerProductIssues } from "./flyerProductReview";
import { summarizeFlyerUsage, flyerUsageFromError, type FlyerAiUsage } from "./flyerUsage";

export const MAX_FLYER_FILES = 30;
export const FLYER_FILE_LIMIT_MESSAGE = `Select up to ${MAX_FLYER_FILES} images or PDFs at a time.`;

export async function extractFlyerBatch<T extends { name: string }>(
  files: T[],
  extract: (file: T) => Promise<{ rows: FlyerRow[]; warning?: string; usage?: FlyerAiUsage | null }>,
  callbacks: {
    onStart: (file: T, index: number) => void;
    onRows: (rows: FlyerRow[]) => void;
  },
) {
  if (files.length > MAX_FLYER_FILES) throw new Error(FLYER_FILE_LIMIT_MESSAGE);
  let rowCount = 0;
  let successCount = 0;
  const messages: string[] = [];
  const usages: Array<FlyerAiUsage | null | undefined> = [];
  for (const [index, file] of files.entries()) {
    callbacks.onStart(file, index);
    let fileUsage: FlyerAiUsage | null | undefined;
    try {
      const result = await extract(file);
      fileUsage = result.usage;
      if (result.warning) messages.push(`${file.name}: ${result.warning}`);
      if (result.rows.length === 0) {
        messages.push(`${file.name}: No product rows found.`);
        continue;
      }
      const rows = result.rows.map((row) => ({
        ...row,
        selected: row.selected && flyerProductIssues(row).length === 0,
        memo: [`Source: ${file.name}`, row.memo].filter(Boolean).join(" · "),
      }));
      callbacks.onRows(rows);
      rowCount += rows.length;
      successCount += 1;
    } catch (error) {
      if (fileUsage === undefined) fileUsage = flyerUsageFromError(error);
      messages.push(`${file.name}: ${error instanceof Error ? error.message : "Extraction failed."}`);
      if (error && typeof error === "object" && "status" in error && error.status === 429) {
        const remaining = files.length - index - 1;
        if (remaining) messages.push(`${remaining} file(s) skipped after reaching the analysis limit.`);
        break;
      }
    } finally {
      usages.push(fileUsage);
    }
  }
  return { rowCount, successCount, messages, usage: summarizeFlyerUsage(usages) };
}
