import ExcelJS from "exceljs";
import type { ExportRow } from "../../application/reports.types";
import type { ExportColumn } from "./export.i18n";

export async function generateExcel(rows: ExportRow[], columns: ExportColumn[], sheetName: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Missão Atos";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns.map((column) => ({
    header: column.caption,
    key: column.key,
    width: Math.max(column.caption.length + 2, 14)
  }));

  for (const row of rows) {
    sheet.addRow(columns.map((column) => column.render(row)));
  }

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}