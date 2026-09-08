import type { FlyerRow } from "../state/adminStore";

export async function extractFlyerBatch<T extends { name: string }>(
  files: T[],
  extract: (file: T) => Promise<{ rows: FlyerRow[]; warning?: string }>,
  callbacks: {
    onStart: (file: T, index: number) => void;
    onRows: (rows: FlyerRow[]) => void;
  },
) {
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
