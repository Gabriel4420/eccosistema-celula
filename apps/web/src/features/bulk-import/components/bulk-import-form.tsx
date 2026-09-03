"use client";

import Link from "next/link";
import { Download, FileUp, Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { ImportDomain, ImportResult, ImportRowResult } from "@mission-atos/contracts";
import { Alert, Button, FieldShell, Table } from "@/src/shared/components";
import { ApiError } from "@/src/shared/api/api-error";
import { cacheStore } from "@/src/shared/cache/cache";
import { useSession } from "@/src/providers/session-provider";
import { toast } from "@/src/shared/toast/toast-store";
import { importFile } from "../api/bulk-import-api";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ["xlsx", "csv", "json"] as const;

interface BulkImportFormProps {
  readonly domain: ImportDomain;
  readonly title: string;
  readonly description: string;
  readonly backHref: string;
  readonly templateHref: string;
}

function validateFile(file: File | null): string | null {
  if (!file) return "Selecione um arquivo para continuar.";
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !ACCEPTED_EXTENSIONS.includes(extension as (typeof ACCEPTED_EXTENSIONS)[number])) {
    return "Use um arquivo nos formatos XLSX, CSV ou JSON.";
  }
  if (file.size > MAX_FILE_BYTES) return "O arquivo deve ter no máximo 5 MB.";
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} KB`;
  }
  return `${(bytes / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}

const resultColumns = [
  {
    key: "row",
    header: "Linha",
    render: (row: ImportRowResult) => row.row
  },
  {
    key: "status",
    header: "Status",
    render: (row: ImportRowResult) => (
      <strong>{row.status === "created" ? "Criado" : "Erro"}</strong>
    )
  },
  {
    key: "message",
    header: "Detalhes",
    render: (row: ImportRowResult) =>
      [row.code, row.message, ...(row.errors ?? [])].filter(Boolean).join("; ") || "Sem observações"
  }
] as const;

export function BulkImportForm({
  domain,
  title,
  description,
  backHref,
  templateHref
}: BulkImportFormProps) {
  const { api } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setFileError(validateFile(selected));
    setRequestError(null);
    setResult(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateFile(file);
    setFileError(validationError);
    setRequestError(null);
    if (validationError || !file) return;

    setBusy(true);
    try {
      const nextResult = await importFile(api, domain, file);
      setResult(nextResult);
      cacheStore(domain).invalidatePrefix("page");
      toast({
        kind: nextResult.failed === 0 ? "success" : "warning",
        title: "Importação concluída",
        description: `${nextResult.created} de ${nextResult.processed} registros criados.`
      });
    } catch (error) {
      setResult(null);
      setRequestError(
        error instanceof ApiError
          ? error.message
          : "Não foi possível importar o arquivo. Verifique os dados e tente novamente."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="bulk-import-title">
      <div className="page-header">
        <div className="flex flex-col gap-2">
          <h1 className="page-title" id="bulk-import-title">{title}</h1>
          <p className="page-description">{description}</p>
        </div>
        <Link className="button button--secondary" href={backHref}>Voltar para a lista</Link>
      </div>

      {requestError ? <Alert variant="error" title="Falha no envio">{requestError}</Alert> : null}

      <form className="fieldset" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">Arquivo de importação</legend>
          <FieldShell
            label="Arquivo"
            htmlFor="bulk-import-file"
            hint="Formatos aceitos: XLSX, CSV e JSON. Limite de 5 MB e 2.000 linhas."
            error={fileError ?? undefined}
            required
          >
            <div className="field__control">
              <div className="file-picker">
                <input
                  ref={inputRef}
                  id="bulk-import-file"
                  className="visually-hidden"
                  name="file"
                  type="file"
                  accept=".xlsx,.csv,.json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/json"
                  onChange={handleFileChange}
                  aria-invalid={fileError ? true : undefined}
                  aria-describedby={fileError ? "bulk-import-file-error" : undefined}
                  required
                />
                <Button
                  type="button"
                  variant="secondary"
                  icon={FileUp}
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                >
                  {file ? "Trocar arquivo" : "Escolher arquivo"}
                </Button>
                <p
                  className={`file-picker__name${file ? " file-picker__name--selected" : ""}`}
                  aria-live="polite"
                >
                  {file ? `${file.name} (${formatFileSize(file.size)})` : "Nenhum arquivo selecionado"}
                </p>
              </div>
            </div>
          </FieldShell>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" icon={Upload} loading={busy} loadingLabel="Importando...">
              Importar arquivo
            </Button>
            <a className="button button--secondary" href={templateHref} download>
              <Download aria-hidden="true" className="button__icon" />
              Baixar modelo CSV
            </a>
          </div>
        </fieldset>
      </form>

      {result ? (
        <section aria-labelledby="bulk-import-result-title" className="fieldset">
          <Alert
            variant={result.failed === 0 ? "success" : "warning"}
            title={result.failed === 0 ? "Todos os registros foram criados" : "Importação concluída com pendências"}
          >
            {`${result.processed} processados, ${result.created} criados e ${result.failed} com erro.`}
          </Alert>
          <h2 className="fieldset__legend" id="bulk-import-result-title">Resultado por linha</h2>
          <Table
            aria-label="Resultado da importação por linha"
            columns={resultColumns}
            rows={result.resultsPerRow}
            rowKey={(row) => String(row.row)}
          />
        </section>
      ) : null}
    </section>
  );
}
