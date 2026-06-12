import * as XLSX from "xlsx";

export type Row = Record<string, string | number | null | undefined>;

/** Trigger browser download for any Blob. */
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Export rows to CSV with UTF-8 BOM so Thai opens correctly in Excel. */
export function exportToCsv(rows: Row[], filename: string) {
  if (rows.length === 0) {
    download(new Blob(["\uFEFF"], { type: "text/csv;charset=utf-8" }), filename);
    return;
  }
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  download(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
    filename.endsWith(".csv") ? filename : `${filename}.csv`,
  );
}

/** Export one-or-many sheets to a single .xlsx workbook. */
export function exportToXlsx(
  sheets: Array<{ name: string; rows: Row[] }>,
  filename: string,
) {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.json_to_sheet(s.rows);
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31) || "Sheet");
  }
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  download(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`,
  );
}
