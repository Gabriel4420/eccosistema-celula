"use client";

import { useState } from "react";
import { useSession } from "@/src/providers/session-provider";
import { Button } from "@/src/shared/components";
import { exportReport, type ExportFormat } from "../api/reports-api";

const FORMAT_OPTIONS: ReadonlyArray<{ readonly value: ExportFormat; readonly label: string }> = [
  { value: "csv", label: "CSV" },
  { value: "xlsx", label: "Excel" },
  { value: "pdf", label: "PDF" }
];

export function ExportButton({ reportType, params }: { readonly reportType: string; readonly params?: Record<string, string> }) {
  const { api } = useSession();
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setExporting(true);
    try {
      const blob = await exportReport(api, reportType, format, params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}_${new Date().toISOString().slice(0, 10)}.${format === "xlsx" ? "xlsx" : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Error handled by ApiClient.onError
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      {FORMAT_OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant="secondary"
          size="sm"
          disabled={exporting}
          onClick={() => handleExport(opt.value)}
        >
          {exporting ? "Exportando..." : `Exportar ${opt.label}`}
        </Button>
      ))}
    </div>
  );
}
