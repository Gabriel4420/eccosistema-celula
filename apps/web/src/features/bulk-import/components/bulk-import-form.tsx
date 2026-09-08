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
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { TranslationKey } from "@/src/shared/i18n/dictionaries";
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

function validateFile(file: File | null, t: (key: TranslationKey) => string): string | null {
  if (!file) return t("bulk.form.error.empty");
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !ACCEPTED_EXTENSIONS.includes(extension as (typeof ACCEPTED_EXTENSIONS)[number])) {
    return t("bulk.form.error.extension");
  }
  if (file.size > MAX_FILE_BYTES) return t("bulk.form.error.size");
  return null;
}

function formatFileSize(bytes: number, locale: string): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toLocaleString(locale, { maximumFractionDigits: 1 })} KB`;
  }
  return `${(bytes / (1024 * 1024)).toLocaleString(locale, { maximumFractionDigits: 1 })} MB`;
}

function resultColumns(t: (key: TranslationKey) => string) {
  return [
    {
      key: "row",
      header: t("bulk.column.row"),
      render: (row: ImportRowResult) => row.row
    },
    {
      key: "status",
      header: t("bulk.column.status"),
      render: (row: ImportRowResult) => (
        <strong>{row.status === "created" ? t("bulk.status.created") : t("bulk.status.error")}</strong>
      )
    },
    {
      key: "message",
      header: t("bulk.column.details"),
      render: (row: ImportRowResult) =>
        [row.code, row.message, ...(row.errors ?? [])].filter(Boolean).join("; ") || t("bulk.noObservations")
    }
  ] as const;
}

export function BulkImportForm({
  domain,
  title,
  description,
  backHref,
  templateHref
}: BulkImportFormProps) {
  const { api } = useSession();
  const { t, locale } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setFileError(validateFile(selected, t));
    setRequestError(null);
    setResult(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateFile(file, t);
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
        title: t("bulk.form.toast.title"),
        description: t("bulk.form.toast.desc", { created: nextResult.created, processed: nextResult.processed })
      });
    } catch (error) {
      setResult(null);
      setRequestError(
        error instanceof ApiError
          ? error.message
          : t("bulk.form.error.generic")
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
        <Link className="button button--secondary" href={backHref}>{t("bulk.form.back")}</Link>
      </div>

      {requestError ? <Alert variant="error" title={t("bulk.form.alertError")}>{requestError}</Alert> : null}

      <form className="fieldset" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">{t("bulk.form.legend")}</legend>
          <FieldShell
            label={t("bulk.label.fileField")}
            htmlFor="bulk-import-file"
            hint={t("bulk.form.hint")}
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
                  {file ? t("bulk.form.change") : t("bulk.form.choose")}
                </Button>
                <p
                  className={`file-picker__name${file ? " file-picker__name--selected" : ""}`}
                  aria-live="polite"
                >
                  {file ? `${file.name} (${formatFileSize(file.size, locale)})` : t("bulk.form.none")}
                </p>
              </div>
            </div>
          </FieldShell>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" icon={Upload} loading={busy} loadingLabel={t("bulk.form.submitting")}>
              {t("bulk.form.submit")}
            </Button>
            <a className="button button--secondary" href={templateHref} download>
              <Download aria-hidden="true" className="button__icon" />
              {t("bulk.form.download")}
            </a>
          </div>
        </fieldset>
      </form>

      {result ? (
        <section aria-labelledby="bulk-import-result-title" className="fieldset">
          <Alert
            variant={result.failed === 0 ? "success" : "warning"}
            title={result.failed === 0 ? t("bulk.result.allCreated") : t("bulk.result.pending")}
          >
            {t("bulk.result.summary", { processed: result.processed, created: result.created, failed: result.failed })}
          </Alert>
          <h2 className="fieldset__legend" id="bulk-import-result-title">{t("bulk.result.title")}</h2>
          <Table
            aria-label={t("bulk.result.aria")}
            columns={resultColumns(t)}
            rows={result.resultsPerRow}
            rowKey={(row) => String(row.row)}
          />
        </section>
      ) : null}
    </section>
  );
}
