import React from "react";
import { Platform } from "react-native";
import {
  extractFlyerRowsWithAi,
  hasFlyerAiEndpoint,
} from "../services/flyerAiImport";
import type { FlyerRow } from "../state/adminStore";
import {
  buildFlyerCsv,
  flyerRowsToProductCsv,
} from "../utils/flyerCsv";
import {
  normalizeOcrText,
  parseFlyerTextToRows,
} from "../utils/adminScreenHelpers";

function downloadCsvFile(prefix: string, csv: string): string | null {
  if (Platform.OS !== "web") {
    return "CSV export is currently available on web admin.";
  }

  const doc = (globalThis as { document?: any }).document;
  const urlApi = (globalThis as { URL?: typeof URL }).URL;
  if (!doc || typeof doc.createElement !== "function" || !urlApi?.createObjectURL) {
    return "CSV export is not available in this browser.";
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const href = urlApi.createObjectURL(blob);
  const link = doc.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = href;
  link.download = `${prefix}-${date}.csv`;
  doc.body.appendChild(link);
  link.click();
  link.remove();
  urlApi.revokeObjectURL(href);
  return null;
}

type UseAdminFlyerImportParams = {
  flyerRows: FlyerRow[];
  setFlyerRows: (rows: FlyerRow[]) => void;
  setFlyerProcessing: (value: boolean) => void;
  setFlyerProgress: (value: string) => void;
  addFlyerRow: () => void;
  removeSelectedFlyerRows: () => void;
  clearFlyerImport: () => void;
  setNotice: (value: string | null) => void;
};

export default function useAdminFlyerImport({
  flyerRows,
  setFlyerRows,
  setFlyerProcessing,
  setFlyerProgress,
  addFlyerRow,
  removeSelectedFlyerRows,
  clearFlyerImport,
  setNotice,
}: UseAdminFlyerImportParams) {
  const recognizeFlyerSources = React.useCallback(async (sources: Array<Blob | string>) => {
    const tesseract = await import("tesseract.js");
    const worker = await tesseract.createWorker("eng", 1, {
      logger: (message: any) => {
        if (!message?.status) return;
        const progress = typeof message.progress === "number" ? ` ${Math.round(message.progress * 100)}%` : "";
        setFlyerProgress(`${message.status}${progress}`);
      },
    });

    try {
      const chunks: string[] = [];
      for (let index = 0; index < sources.length; index += 1) {
        setFlyerProgress(`OCR page ${index + 1} of ${sources.length}`);
        const result = await worker.recognize(sources[index]);
        chunks.push(result.data.text ?? "");
      }
      return normalizeOcrText(chunks.join("\n"));
    } finally {
      await worker.terminate();
    }
  }, [setFlyerProgress]);

  const extractPdfText = React.useCallback(async (file: File) => {
    const pdfjs = await import("pdfjs-dist");
    const workerOptions = pdfjs.GlobalWorkerOptions as { workerSrc?: string };
    if (!workerOptions.workerSrc) {
      workerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjs.getDocument({
      data: bytes,
      isEvalSupported: false,
      useWorkerFetch: false,
    } as any);
    const pdf = await loadingTask.promise;

    try {
      const pageCount = Math.min(pdf.numPages, 5);
      const pages: string[] = [];
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        setFlyerProgress(`Reading PDF text ${pageNumber} of ${pageCount}`);
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const grouped = new Map<number, string[]>();
        (textContent.items as any[]).forEach((item) => {
          const value = String(item?.str ?? "").trim();
          if (!value) return;
          const y = Math.round(Number(item?.transform?.[5] ?? 0));
          const existing = grouped.get(y) ?? [];
          existing.push(value);
          grouped.set(y, existing);
        });
        const pageText = Array.from(grouped.entries())
          .sort((a, b) => b[0] - a[0])
          .map(([, values]) => values.join(" "))
          .join("\n");
        pages.push(pageText);
        page.cleanup();
      }
      return normalizeOcrText(pages.join("\n"));
    } finally {
      await pdf.cleanup();
      await loadingTask.destroy();
    }
  }, [setFlyerProgress]);

  const renderPdfPagesForOcr = React.useCallback(async (file: File) => {
    const pdfjs = await import("pdfjs-dist");
    const workerOptions = pdfjs.GlobalWorkerOptions as { workerSrc?: string };
    if (!workerOptions.workerSrc) {
      workerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }

    const doc = (globalThis as { document?: Document }).document;
    if (!doc) {
      throw new Error("PDF rendering requires a browser document.");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjs.getDocument({
      data: bytes,
      isEvalSupported: false,
      useWorkerFetch: false,
    } as any);
    const pdf = await loadingTask.promise;

    try {
      const pageCount = Math.min(pdf.numPages, 3);
      const images: string[] = [];
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        setFlyerProgress(`Rendering PDF page ${pageNumber} of ${pageCount}`);
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = doc.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Could not create a canvas for PDF rendering.");
        }
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvasContext: context, viewport } as any).promise;
        images.push(canvas.toDataURL("image/png"));
        page.cleanup();
      }
      return images;
    } finally {
      await pdf.cleanup();
      await loadingTask.destroy();
    }
  }, [setFlyerProgress]);

  const processFlyerFile = React.useCallback(
    async (file: File) => {
      setFlyerProcessing(true);
      setFlyerProgress("Preparing file");
      setNotice(null);

      try {
        if (hasFlyerAiEndpoint) {
          setFlyerProgress("AI extracting table");
          const aiResult = await extractFlyerRowsWithAi(file);
          if (aiResult.rows.length > 0) {
            setFlyerRows(aiResult.rows);
            setFlyerProgress("");
            setNotice(
              `${aiResult.warning ? `${aiResult.warning} ` : ""}AI extracted ${aiResult.rows.length} table rows. Review before saving.`,
            );
            return;
          }
          setFlyerProgress("AI found no rows. Running OCR fallback");
        }

        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        let text = "";
        if (isPdf) {
          text = await extractPdfText(file);
          if (parseFlyerTextToRows(text).length === 0) {
            const images = await renderPdfPagesForOcr(file);
            text = await recognizeFlyerSources(images);
          }
        } else {
          text = await recognizeFlyerSources([file]);
        }

        const parsedRows = parseFlyerTextToRows(text);
        setFlyerRows(parsedRows);
        setFlyerProgress("");
        setNotice(
          parsedRows.length > 0
            ? `Flyer parsed into ${parsedRows.length} table rows. Review before saving.`
            : "No price rows were found. You can paste OCR text manually or add rows.",
        );
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Flyer processing failed.");
        setFlyerProgress("");
      } finally {
        setFlyerProcessing(false);
      }
    },
    [extractPdfText, recognizeFlyerSources, renderPdfPagesForOcr, setFlyerProcessing, setFlyerProgress, setFlyerRows, setNotice],
  );

  const handlePickFlyerFile = React.useCallback(() => {
    if (Platform.OS !== "web") {
      setNotice("Flyer import is currently available on web admin.");
      return;
    }
    const doc = (globalThis as { document?: any }).document;
    if (!doc || typeof doc.createElement !== "function") {
      setNotice("File picker is not available in this environment.");
      return;
    }

    const input = doc.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif,application/pdf,.pdf";
    input.multiple = false;
    input.onchange = () => {
      const selected = input.files?.[0];
      if (!selected) return;
      void processFlyerFile(selected);
    };
    input.click();
  }, [processFlyerFile, setNotice]);

  const handleAddFlyerRow = React.useCallback(() => {
    addFlyerRow();
  }, [addFlyerRow]);

  const handleRemoveSelectedFlyerRows = React.useCallback(() => {
    removeSelectedFlyerRows();
  }, [removeSelectedFlyerRows]);

  const handleClearFlyerImport = React.useCallback(() => {
    clearFlyerImport();
    setNotice("Flyer import cleared.");
  }, [clearFlyerImport, setNotice]);

  const handleExportFlyerCsv = React.useCallback(() => {
    const selectedRows = flyerRows.filter((row) => row.selected);
    if (selectedRows.length === 0) {
      setNotice("Select at least one flyer row to export.");
      return;
    }

    const error = downloadCsvFile("flyer", buildFlyerCsv(selectedRows));
    if (error) {
      setNotice(error);
      return;
    }
    setNotice(`Exported ${selectedRows.length} flyer rows to CSV.`);
  }, [flyerRows, setNotice]);

  const handleExportFlyerProductCsv = React.useCallback(() => {
    const selectedRows = flyerRows.filter((row) => row.selected);
    if (selectedRows.length === 0) {
      setNotice("Select at least one flyer row to export.");
      return;
    }

    const error = downloadCsvFile("flyer-products", flyerRowsToProductCsv(selectedRows));
    if (error) {
      setNotice(error);
      return;
    }
    setNotice(`Exported ${selectedRows.length} flyer rows as product import CSV.`);
  }, [flyerRows, setNotice]);

  return {
    handleAddFlyerRow,
    handleClearFlyerImport,
    handleExportFlyerCsv,
    handleExportFlyerProductCsv,
    handlePickFlyerFile,
    handleRemoveSelectedFlyerRows,
  };
}
