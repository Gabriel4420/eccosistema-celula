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
import { getMeetingsReport } from "@/src/features/reports/api/reports-api";
import type { MeetingsReportItem } from "@mission-atos/contracts";
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

interface MeetingsParams extends ReportParams {
  readonly status: string;
}

function readParams(searchParams: URLSearchParams): MeetingsParams {
  const status = searchParams.get("status");
  return {
    page: readPage(searchParams),
    status: status === "SCHEDULED" || status === "COMPLETED" || status === "CANCELED" ? status : "",
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
  };
}

export function MeetingsReport() {
  const { api } = useSession();
  const { searchParams, navigate } = useReportNavigation("/reports/meetings");
  const params = readParams(searchParams);

  const period =
    params.from && params.to ? { from: params.from, to: params.to } : {};

  const { data: page, loading, error, reload } = useRemoteQuery({
    fetcher: () =>
      getMeetingsReport(api, {
        page: params.page,
        pageSize: PAGE_SIZE,
        status: params.status || undefined,
        ...period,
      }),
    cacheName: REPORTS_CACHE,
    cacheKey: `meetings:page:${params.page}:status:${params.status}:from:${params.from}:to:${params.to}`,
    ttlMs: 30_000,
  });

  const rows = (page?.data as readonly MeetingsReportItem[] | undefined) ?? [];

  const exportParams: Record<string, string> = {};
  if (params.status) exportParams.status = params.status;
  if (params.from) exportParams.from = params.from;
  if (params.to) exportParams.to = params.to;

  return (
    <section aria-labelledby="meetings-report-title">
      <div className="page-header w-full">
        <div className="flex flex-col">
          <h1 className="page-title" id="meetings-report-title">
            Encontros
          </h1>
          <p className="page-description">
            Relatório consolidado de encontros por período.
          </p>
        </div>
        <ExportButton reportType="meetings" params={exportParams} />
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
            { value: "SCHEDULED", label: "Agendado" },
            { value: "COMPLETED", label: "Concluído" },
            { value: "CANCELED", label: "Cancelado" },
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
        <ErrorState title="Não foi possível carregar os encontros" onRetry={() => void reload()}>
          Tente novamente em instantes.
        </ErrorState>
      ) : null}

      {loading && rows.length === 0 ? (
        <div aria-label="Carregando encontros">
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
        </div>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <EmptyState title="Nenhum encontro encontrado">
          Não há encontros registrados no período.
        </EmptyState>
      ) : null}

      {rows.length > 0 ? (
        <>
          <Table<MeetingsReportItem>
            rowKey={(item) => `${item.cell.id}-${item.meetingDate}`}
            columns={[
              { key: "cell", header: "Célula", render: (item) => `${item.cell.code} — ${item.cell.name}` },
              { key: "date", header: "Data", render: (item) => new Date(item.meetingDate).toLocaleDateString("pt-BR") },
              { key: "status", header: "Status", render: (item) => formatMeetingStatus(item.status) },
              { key: "present", header: "Presentes", render: (item) => item.presentCount },
              { key: "absent", header: "Ausentes", render: (item) => item.absentCount },
              { key: "visitors", header: "Visitantes", render: (item) => item.visitorCount },
              { key: "rate", header: "Frequência", render: (item) => (item.attendanceRate !== null ? `${item.attendanceRate}%` : "—") },
              { key: "report", header: "Relatório", render: (item) => formatReportStatus(item.reportStatus) },
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

function formatMeetingStatus(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: "Agendado",
    COMPLETED: "Concluído",
    CANCELED: "Cancelado",
  };
  return map[status] ?? status;
}

function formatReportStatus(status: string | null): string {
  if (!status) return "—";
  const map: Record<string, string> = {
    NOT_STARTED: "Não iniciado",
    DRAFT: "Rascunho",
    SUBMITTED: "Submetido",
    RETURNED: "Devolvido",
    CANCELED: "Cancelado",
  };
  return map[status] ?? status;
}