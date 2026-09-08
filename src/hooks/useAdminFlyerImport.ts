import { extractFlyerBatch } from "../utils/flyerBatchImport";
import { flyerCategory } from "../utils/flyerCategory";
import { flyerProductIssues } from "../utils/flyerProductReview";
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
import { downloadCsvFile } from "../utils/adminCsvFiles";

type UseAdminFlyerImportParams = {
  flyerRows: FlyerRow[];
  setFlyerRows: (rows: FlyerRow[] | ((current: FlyerRow[]) => FlyerRow[])) => void;
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
  const batchRunning = React.useRef(false);
  const fileLabel = React.useRef("");
  const reportProgress = React.useCallback((message: string) => {
    setFlyerProgress(`${fileLabel.current}${message ? ` — ${message}` : ""}`);
  }, [setFlyerProgress]);

  const recognizeFlyerSources = React.useCallback(async (sources: Array<Blob | string>) => {
    const tesseract = await import("tesseract.js");
    const worker = await tesseract.createWorker("eng", 1, {
      logger: (message: any) => {
        if (!message?.status) return;
        const progress = typeof message.progress === "number" ? ` ${Math.round(message.progress * 100)}%` : "";
        reportProgress(`${message.status}${progress}`);
      },
    });

    try {
      const chunks: string[] = [];
      for (let index = 0; index < sources.length; index += 1) {
        reportProgress(`OCR page ${index + 1} of ${sources.length}`);
        const result = await worker.recognize(sources[index]);
        chunks.push(result.data.text ?? "");
      }
      return normalizeOcrText(chunks.join("\n"));
    } finally {
      await worker.terminate();
    }
  }, [reportProgress]);

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
        reportProgress(`Reading PDF text ${pageNumber} of ${pageCount}`);
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
  }, [reportProgress]);

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
      const pageCount = Math.min(pdf.numPages, 5);
      const images: string[] = [];
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        reportProgress(`Rendering PDF page ${pageNumber} of ${pageCount}`);
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
  }, [reportProgress]);

  const processFlyerFile = React.useCallback(async (file: File) => {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    let warning = "";
    if (hasFlyerAiEndpoint) {
      reportProgress("AI extracting text");
      const result = await extractFlyerRowsWithAi(file);
      if (result.rows.length > 0) return result;
      warning = result.warning ?? "";
      reportProgress("AI found no rows. Running OCR fallback");
    }
    let text = "";
    if (isPdf) {
      text = await extractPdfText(file);
      if (parseFlyerTextToRows(text).length === 0) {
        text = await recognizeFlyerSources(await renderPdfPagesForOcr(file));
      }
    } else {
      text = await recognizeFlyerSources([file]);
    }
    return {
      rows: parseFlyerTextToRows(text).map((row) => ({ ...row, mainCategory: flyerCategory(row.mainCategory) })),
      warning: [warning, "OCR fallback used; review all fields."].filter(Boolean).join(" "),
    };
  }, [extractPdfText, recognizeFlyerSources, renderPdfPagesForOcr, reportProgress]);

  const processFlyerFiles = React.useCallback(async (files: File[]) => {
    if (batchRunning.current || files.length === 0) return;
    batchRunning.current = true;
    setFlyerProcessing(true);
    setNotice(null);
    try {
      const result = await extractFlyerBatch(files, processFlyerFile, {
        onStart: (file, index) => {
          fileLabel.current = `File ${index + 1}/${files.length}: ${file.name}`;
          reportProgress("Preparing file");
        },
        onRows: (rows) => setFlyerRows((current) => [...current, ...rows]),
      });
      setNotice(`Added ${result.rowCount} text rows from ${result.successCount}/${files.length} files. Existing rows kept. Review before exporting.${result.messages.length ? ` ${result.messages.join(" | ")}` : ""}`);
    } finally {
      batchRunning.current = false;
      fileLabel.current = "";
      setFlyerProgress("");
      setFlyerProcessing(false);
    }
  }, [processFlyerFile, reportProgress, setFlyerRows, setFlyerProcessing, setFlyerProgress, setNotice]);

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
    input.multiple = true;
    input.onchange = () => {
      const selected = Array.from(input.files ?? []) as File[];
      if (selected.length === 0) return;
      void processFlyerFiles(selected);
    };
    input.click();
  }, [processFlyerFiles, setNotice]);

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

    const incomplete = selectedRows.filter((row) => flyerProductIssues(row).length > 0);
    if (incomplete.length > 0) {
      const first = incomplete[0];
      setNotice(`Review ${incomplete.length} selected row(s) before Product export. ${first.englishName || first.koreanName || "Unnamed product"}: ${flyerProductIssues(first).join("; ")}. Correct or deselect these rows. Export CSV keeps all review notes.`);
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
