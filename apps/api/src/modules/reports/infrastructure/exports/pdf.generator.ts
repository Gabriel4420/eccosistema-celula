import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { ExportLocale } from "@mission-atos/contracts";
import PDFDocument from "pdfkit";
import type { ExportRow } from "../../application/reports.types";
import { exportPdfMeta, type ExportColumn } from "./export.i18n";

const DEFAULT_LOGO_PATH = resolve(__dirname, "../../../../../assets/missao-atos-logo.png");

export function generatePdf(rows: ExportRow[], columns: ExportColumn[], title: string, churchName: string, locale: ExportLocale = "pt-BR", logoPath: string = DEFAULT_LOGO_PATH): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
    const chunks: Buffer[] = [];
    const meta = exportPdfMeta(locale);

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const availableLogo = logoPath && existsSync(logoPath) ? logoPath : undefined;

    if (availableLogo) {
      const maxLogoWidth = 170;
      const logoX = doc.page.margins.left + (pageWidth - maxLogoWidth) / 2;
      doc.image(availableLogo, logoX, doc.y, { width: maxLogoWidth });
      doc.moveDown(0.6);
    } else {
      doc.moveDown(0.6);
    }

    doc.fontSize(16).font("Helvetica-Bold").text(churchName, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(12).font("Helvetica").text(title, { align: "center" });
    doc.moveDown(0.2);
    doc.fontSize(8).fillColor("#666666").text(`${meta.generatedAt}${new Date().toLocaleString(locale)}`, { align: "center" });
    doc.moveDown(1);

    const colCount = columns.length;
    const colWidth = Math.max(pageWidth / colCount, 40);
    const rowHeight = 18;
    const startY = doc.y;
    let currentY = startY;

    const drawHeader = (y: number) => {
      doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFFFFF");
      doc.rect(doc.x, y, pageWidth, rowHeight).fill("#4472C4");
      let x = doc.page.margins.left;
      for (const column of columns) {
        doc.fillColor("#FFFFFF").text(column.caption, x + 2, y + 4, { width: colWidth - 4, height: rowHeight - 4 });
        x += colWidth;
      }
      return y + rowHeight;
    };

    currentY = drawHeader(currentY);

    for (let i = 0; i < rows.length; i++) {
      if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
        currentY = drawHeader(currentY);
      }

      const bgColor = i % 2 === 0 ? "#F2F2F2" : "#FFFFFF";
      doc.rect(doc.page.margins.left, currentY, pageWidth, rowHeight).fill(bgColor);

      let x = doc.page.margins.left;
      doc.font("Helvetica").fontSize(7).fillColor("#333333");
      for (const column of columns) {
        const row = rows[i];
        const text = row !== undefined ? column.render(row) : "";
        doc.text(text, x + 2, currentY + 4, { width: colWidth - 4, height: rowHeight - 4 });
        x += colWidth;
      }
      currentY += rowHeight;
    }

    doc.moveDown(1);
    doc.fontSize(8).fillColor("#999999").text(meta.recordTotal(rows.length), doc.page.margins.left, currentY + 10);

    doc.end();
  });
}