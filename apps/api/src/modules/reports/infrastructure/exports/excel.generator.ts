import ExcelJS from "exceljs";
import type { ExportRow } from "../../application/reports.types";

export async function generateExcel(rows: ExportRow[], columns: string[], sheetName: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Missão Atos";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns.map((col) => ({
    header: col,
    key: col,
    width: Math.max(col.length + 2, 14)
  }));

  for (const row of rows) {
    const values = columns.map((col) => {
      const value = row[col];
      return value === null || value === undefined ? "" : value;
    });
    sheet.addRow(values);
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
