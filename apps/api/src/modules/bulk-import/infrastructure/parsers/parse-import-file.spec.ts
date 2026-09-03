import ExcelJS from "exceljs";
import { readFile, unlink } from "node:fs/promises";
import { parseImportFile, detectFormat } from "./parse-import-file";
import { BulkImportError } from "./file-parser.types";

async function xlsxBuffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("pessoas");
  sheet.addRow(["fullName", "phone", "email", "cellCode"]);
  sheet.addRow(["Maria da Silva", "+5511999998888", "maria@x.com", "CEL-01"]);
  sheet.addRow(["João", "", undefined, undefined]);
  const path = `${__dirname}/tmp-test.xlsx`;
  await workbook.xlsx.writeFile(path);
  const raw = await readFile(path);
  await unlink(path).catch(() => undefined);
  return raw;
}

describe("bulk-import file parsers", () => {
  describe("detectFormat", () => {
    it("detects xlsx by MIME", () => {
      expect(detectFormat("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "f.bin")).toBe("xlsx");
    });
    it("detects csv by MIME", () => {
      expect(detectFormat("text/csv", "f.bin")).toBe("csv");
    });
    it("detects json by MIME", () => {
      expect(detectFormat("application/json", "f.bin")).toBe("json");
    });
    it("falls back to extension", () => {
      expect(detectFormat("application/octet-stream", "pessoas.xlsx")).toBe("xlsx");
    });
    it("rejects unsupported", () => {
      expect(() => detectFormat("application/pdf", "f.pdf")).toThrow(BulkImportError);
    });
  });

  describe("parseJson", () => {
    it("parses array of items", async () => {
      const raw = Buffer.from(JSON.stringify([{ fullName: "A" }, { fullName: "B" }]));
      const result = await parseImportFile(raw, "application/json", "pessoas.json");
      expect(result.format).toBe("json");
      expect(result.rows).toHaveLength(2);
    });

    it("parses { items }", async () => {
      const raw = Buffer.from(JSON.stringify({ items: [{ fullName: "A" }] }));
      const result = await parseImportFile(raw, "application/json", "pessoas.json");
      expect(result.rows).toHaveLength(1);
    });

    it("rejects invalid json shape", async () => {
      const raw = Buffer.from(JSON.stringify({ foo: 1 }));
      await expect(parseImportFile(raw, "application/json", "pessoas.json")).rejects.toThrow(BulkImportError);
    });

    it("preserves malformed items so they can be reported by row", async () => {
      const raw = Buffer.from(JSON.stringify([{ fullName: "Maria" }, null, 42]));
      const result = await parseImportFile(raw, "application/json", "pessoas.json");
      expect(result.rows).toEqual([{ fullName: "Maria" }, {}, {}]);
    });
  });

  describe("parseCsv", () => {
    it("parses header + rows with bom", async () => {
      const raw = Buffer.from("\uFEFFfullName,email\nMaria,maria@x.com\nJoão,joao@x.com", "utf-8");
      const result = await parseImportFile(raw, "text/csv", "pessoas.csv");
      expect(result.rows[0]).toMatchObject({ fullName: "Maria", email: "maria@x.com" });
      expect(result.rows).toHaveLength(2);
    });
  });

  describe("parseXlsx", () => {
    it("parses header + rows", async () => {
      const raw = await xlsxBuffer();
      const result = await parseImportFile(raw, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "pessoas.xlsx");
      expect(result.rows[0]).toMatchObject({ fullName: "Maria da Silva", phone: "+5511999998888", email: "maria@x.com", cellCode: "CEL-01" });
    });
  });
});
