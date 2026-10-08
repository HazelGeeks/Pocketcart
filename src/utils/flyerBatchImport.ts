import type { FlyerRow } from "../state/adminStore";
import { flyerProductIssues } from "./flyerProductReview";

export const MAX_FLYER_FILES = 30;
export const FLYER_FILE_LIMIT_MESSAGE = `Select up to ${MAX_FLYER_FILES} images or PDFs at a time.`;

export async function extractFlyerBatch<T extends { name: string }>(
  files: T[],
  extract: (file: T) => Promise<{ rows: FlyerRow[]; warning?: string }>,
  callbacks: {
    onStart: (file: T, index: number) => void;
    onRows: (rows: FlyerRow[]) => void;
  },
) {
  if (files.length > MAX_FLYER_FILES) throw new Error(FLYER_FILE_LIMIT_MESSAGE);
  let rowCount = 0;
  let successCount = 0;
  const messages: string[] = [];
  for (const [index, file] of files.entries()) {
    callbacks.onStart(file, index);
    try {
      const result = await extract(file);
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
      messages.push(`${file.name}: ${error instanceof Error ? error.message : "Extraction failed."}`);
    }
  }
  return { rowCount, successCount, messages };
}
