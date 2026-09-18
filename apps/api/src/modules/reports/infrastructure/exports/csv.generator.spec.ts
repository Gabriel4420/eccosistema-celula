import { generateCsv } from "./csv.generator";
import type { ExportRow } from "../../application/reports.types";
import type { ExportColumn } from "./export.i18n";

function identityColumns(keys: string[]): ExportColumn[] {
  return keys.map((key) => ({
    key,
    caption: key,
    render: (row) => (row[key] === null || row[key] === undefined ? "" : String(row[key]))
  }));
}

describe("generateCsv", () => {
  it("emits only the header row when there are no rows", () => {
    expect(generateCsv([], identityColumns(["name", "cell"]))).toBe("name,cell\n");
  });

  it("quotes values that contain commas, quotes or newlines", () => {
    const csv = generateCsv(
      [{ name: 'Fulano, "da Silva"', cell: "C-01" }],
      identityColumns(["name", "cell"])
    );
    expect(csv).toContain('"Fulano, ""da Silva"""');
  });

  it("neutralizes formula injection prefixes with a leading apostrophe", () => {
    const rows: ExportRow[] = [
      { name: "=SUM(A1:A9)", cell: "C-01" },
      { name: "+cmd", cell: "C-02" },
      { name: "-cmd", cell: "C-03" },
      { name: "@cmd", cell: "C-04" },
      { name: "\tcmd", cell: "C-05" },
      { name: "\rcmd", cell: "C-06" },
    ];
    const csv = generateCsv(rows, identityColumns(["name", "cell"]));
    const lines = csv.split("\n");
    expect(lines[1]).toContain("'=SUM(A1:A9)");
    expect(lines[2]).toContain("'+cmd");
    expect(lines[3]).toContain("'-cmd");
    expect(lines[4]).toContain("'@cmd");
    expect(lines[5]).toContain("'");
    expect(lines[6]).toContain("'");
  });

  it("keeps safe values unchanged", () => {
    const csv = generateCsv(
      [{ name: "Maria", cell: "C-07" }],
      identityColumns(["name", "cell"])
    );
    expect(csv).toBe("name,cell\nMaria,C-07\n");
  });
});