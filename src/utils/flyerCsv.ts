import type { FlyerRow } from "../state/adminStore";

const FLYER_CSV_COLUMNS: Array<{ label: string; key: keyof Pick<
  FlyerRow,
  | "martName"
  | "regionBranch"
  | "saleStartDate"
  | "saleEndDate"
  | "koreanName"
  | "englishName"
  | "mainCategory"
  | "price"
  | "unit"
  | "memo"
> }> = [
  { label: "store_brand", key: "martName" },
  { label: "store_name", key: "regionBranch" },
  { label: "sale_start_date", key: "saleStartDate" },
  { label: "sale_end_date", key: "saleEndDate" },
  { label: "english_name", key: "englishName" },
  { label: "korean_name", key: "koreanName" },
  { label: "category", key: "mainCategory" },
  { label: "price", key: "price" },
  { label: "unit", key: "unit" },
  { label: "memo", key: "memo" },
];

function csvCell(value: string): string {
  const text = value.replace(/\r?\n/g, " ").trim();
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

export function buildFlyerCsv(rows: FlyerRow[]): string {
  const header = FLYER_CSV_COLUMNS.map((column) => csvCell(column.label)).join(",");
  const body = rows.map((row) =>
    FLYER_CSV_COLUMNS.map((column) => csvCell(String(row[column.key] ?? ""))).join(","),
  );
  return ["\uFEFF" + header, ...body].join("\r\n") + "\r\n";
}

export function flyerRowsToProductCsv(rows: FlyerRow[]): string {
  const header = [
    "store_brand",
    "store_name",
    "sale_start_date",
    "sale_end_date",
    "english_name",
    "korean_name",
    "category",
    "thumbnail_url",
    "source_price",
    "unit",
    "memo",
  ];
  const body = rows.map((row) => {
    return [
      row.martName,
      row.regionBranch || row.martName,
      row.saleStartDate,
      row.saleEndDate,
      row.englishName ?? "",
      row.koreanName,
      row.mainCategory || row.subCategory || "Uncategorized",
      row.thumbnailUrl ?? "",
      row.price,
      row.unit,
      row.memo,
    ].map(csvCell).join(",");
  });
  return ["\uFEFF" + header.map(csvCell).join(","), ...body].join("\r\n") + "\r\n";
}
