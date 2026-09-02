"use client";

import { FilterX } from "lucide-react";
import {
  Button,
  EmptyState,
  ErrorState,
  Pagination,
  SelectField,
  Skeleton,
  Table,
} from "@/src/shared/components";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { getPendingReports } from "@/src/features/reports/api/reports-api";
import type { PendingReportItem } from "@mission-atos/contracts";
import { ExportButton } from "./export-button";
import {
  PERIOD_OPTIONS,
  periodValue,
  readPage,
  splitPeriod,
  useReportNavigation,
  type ReportParams,
} from "./reports-params";

const PAGE_SIZE = 20;
const REPORTS_CACHE = "reports";

interface PendingParams extends ReportParams {
  readonly status: string;
}

function readParams(searchParams: URLSearchParams): PendingParams {
  const status = searchParams.get("status");
  return {
    page: readPage(searchParams),
    status: status === "NO_REPORT" || status === "NOT_STARTED" || status === "DRAFT" || status === "RETURNED" ? status : "",
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
  };
}

export function PendingReports() {
  const { api } = useSession();
  const { searchParams, navigate } = useReportNavigation("/reports/pending");
  const params = readParams(searchParams);

  const period =
    params.from && params.to ? { from: params.from, to: params.to } : {};

  const { data: page, loading, error, reload } = useRemoteQuery({
    fetcher: () =>
      getPendingReports(api, {
        page: params.page,
        pageSize: PAGE_SIZE,
        status: params.status || undefined,
        ...period,
      }),
    cacheName: REPORTS_CACHE,
    cacheKey: `pending:page:${params.page}:status:${params.status}:from:${params.from}:to:${params.to}`,
    ttlMs: 30_000,
  });

  const rows = (page?.data as readonly PendingReportItem[] | undefined) ?? [];

  const exportParams: Record<string, string> = {};
  if (params.status) exportParams.status = params.status;
  if (params.from) exportParams.from = params.from;
  if (params.to) exportParams.to = params.to;

  return (
    <section aria-labelledby="pending-reports-title">
      <div className="page-header w-full">
        <div className="flex flex-col">
          <h1 className="page-title" id="pending-reports-title">
            Relatórios Pendentes
          </h1>
          <p className="page-description">
            Encontros concluídos que ainda não tiveram o relatório submetido.
          </p>
        </div>
        <ExportButton reportType="pending" params={exportParams} />
      </div>

      <div className="toolbar">
        <SelectField
          label="Período"
          name="period"
          value={periodValue(params)}
          onChange={(event) =>
            navigate({ ...splitPeriod(event.target.value), page: 1 })
          }
          options={PERIOD_OPTIONS}
        />
        <SelectField
          label="Status"
          name="status"
          value={params.status}
          onChange={(event) => navigate({ status: event.target.value, page: 1 })}
          options={[
            { value: "", label: "Todos" },
            { value: "NO_REPORT", label: "Sem relatório" },
            { value: "NOT_STARTED", label: "Não iniciado" },
            { value: "DRAFT", label: "Rascunho" },
            { value: "RETURNED", label: "Devolvido" },
          ]}
        />
        <Button
          variant="secondary"
          icon={FilterX}
          onClick={() => navigate({ status: "", from: "", to: "", page: 1 })}
        >
          Limpar filtros
        </Button>
      </div>

      {error ? (
        <ErrorState title="Não foi possível carregar os relatórios pendentes" onRetry={() => void reload()}>
          Tente novamente em instantes.
        </ErrorState>
      ) : null}

      {loading && rows.length === 0 ? (
        <div aria-label="Carregando relatórios">
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
        </div>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <EmptyState title="Nenhum relatório pendente">
          Todos os encontros concluídos já foram reportados.
        </EmptyState>
      ) : null}

      {rows.length > 0 ? (
        <>
          <Table<PendingReportItem>
            rowKey={(item) => `${item.cell.id}-${item.meetingDate}`}
            columns={[
              {
                key: "cell",
                header: "Célula",
                render: (item) => `${item.cell.code} — ${item.cell.name}`,
              },
              {
                key: "leader",
                header: "Líder",
                render: (item) =>
                  item.leader ? `${item.leader.firstName} ${item.leader.lastName}` : "—",
              },
              {
                key: "date",
                header: "Data do encontro",
                render: (item) => new Date(item.meetingDate).toLocaleDateString("pt-BR"),
              },
              {
                key: "days",
                header: "Dias sem relatório",
                render: (item) => item.daysSinceMeeting,
              },
              {
                key: "status",
                header: "Status",
                render: (item) => formatReportStatus(item.reportStatus),
              },
            ]}
            rows={rows}
          />
          <Pagination
            page={params.page}
            pageSize={PAGE_SIZE}
            totalItems={page?.meta.totalItems ?? 0}
            totalPages={page?.meta.totalPages ?? 0}
            onPageChange={(nextPage) => navigate({ page: nextPage })}
          />
        </>
      ) : null}
    </section>
  );
}

function formatReportStatus(status: string): string {
  const map: Record<string, string> = {
    NOT_STARTED: "Não iniciado",
    DRAFT: "Rascunho",
    SUBMITTED: "Submetido",
    RETURNED: "Devolvido",
  };
  return map[status] ?? status;
}