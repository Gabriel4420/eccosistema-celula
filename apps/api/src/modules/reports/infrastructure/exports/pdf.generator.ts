import PDFDocument from "pdfkit";
import type { ExportRow } from "../../application/reports.types";

export function generatePdf(rows: ExportRow[], columns: string[], title: string, churchName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).font("Helvetica-Bold").text(churchName, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(12).font("Helvetica").text(title, { align: "center" });
    doc.moveDown(0.2);
    doc.fontSize(8).fillColor("#666666").text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, { align: "center" });
    doc.moveDown(1);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colCount = columns.length;
    const colWidth = Math.max(pageWidth / colCount, 40);
    const rowHeight = 18;
    const startY = doc.y;
    let currentY = startY;

    const drawHeader = (y: number) => {
      doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFFFFF");
      doc.rect(doc.x, y, pageWidth, rowHeight).fill("#4472C4");
      let x = doc.page.margins.left;
      for (const col of columns) {
        doc.fillColor("#FFFFFF").text(col, x + 2, y + 4, { width: colWidth - 4, height: rowHeight - 4 });
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
      for (const col of columns) {
        const row = rows[i];
        const value = row !== undefined ? row[col] : undefined;
        const text = value === null || value === undefined ? "" : String(value);
        doc.text(text, x + 2, currentY + 4, { width: colWidth - 4, height: rowHeight - 4 });
        x += colWidth;
      }
      currentY += rowHeight;
    }

    doc.moveDown(1);
    doc.fontSize(8).fillColor("#999999").text(`${rows.length} registro(s)`, doc.page.margins.left, currentY + 10);

    doc.end();
  });
}
