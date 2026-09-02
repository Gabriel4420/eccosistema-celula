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
import { getVisitorReport } from "@/src/features/reports/api/reports-api";
import type { VisitorReportItem } from "@mission-atos/contracts";
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

interface VisitorParams extends ReportParams {
  readonly contactPending: string;
}

function readParams(searchParams: URLSearchParams): VisitorParams {
  const contactPending = searchParams.get("contactPending");
  return {
    page: readPage(searchParams),
    contactPending: contactPending === "true" || contactPending === "false" ? contactPending : "",
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
  };
}

export function VisitorReport() {
  const { api } = useSession();
  const { searchParams, navigate } = useReportNavigation("/reports/visitors");
  const params = readParams(searchParams);

  const period =
    params.from && params.to ? { from: params.from, to: params.to } : {};

  const { data: page, loading, error, reload } = useRemoteQuery({
    fetcher: () =>
      getVisitorReport(api, {
        page: params.page,
        pageSize: PAGE_SIZE,
        ...(params.contactPending === "true" ? { contactPending: true } : {}),
        ...period,
      }),
    cacheName: REPORTS_CACHE,
    cacheKey: `visitors:page:${params.page}:pending:${params.contactPending}:from:${params.from}:to:${params.to}`,
    ttlMs: 30_000,
  });

  const rows = (page?.data as readonly VisitorReportItem[] | undefined) ?? [];
  const metrics = page?.metrics;

  const exportParams: Record<string, string> = {};
  if (params.contactPending === "true") exportParams.contactPending = "true";
  if (params.from) exportParams.from = params.from;
  if (params.to) exportParams.to = params.to;

  return (
    <section aria-labelledby="visitor-report-title">
      <div className="page-header w-full">
        <div className="flex flex-col">
          <h1 className="page-title" id="visitor-report-title">
            Visitantes
          </h1>
          <p className="page-description">
            Lista de visitantes e métricas de contato.
          </p>
        </div>
        <ExportButton reportType="visitors" params={exportParams} />
      </div>

      {metrics ? (
        <div className="stat-cards">
          <div className="stat-card">
            <span className="stat-card__label">Total de visitantes</span>
            <span className="stat-card__value">{metrics.total}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Contato pendente</span>
            <span className="stat-card__value">{metrics.contactPendingCount}</span>
          </div>
          {metrics.topCell ? (
            <div className="stat-card">
              <span className="stat-card__label">Célula com mais visitantes</span>
              <span className="stat-card__value">
                {metrics.topCell.code} ({metrics.topCell.count})
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

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
          label="Contato"
          name="contactPending"
          value={params.contactPending}
          onChange={(event) => navigate({ contactPending: event.target.value, page: 1 })}
          options={[
            { value: "", label: "Todos" },
            { value: "true", label: "Pendente" },
            { value: "false", label: "Realizado" },
          ]}
        />
        <Button
          variant="secondary"
          icon={FilterX}
          onClick={() => navigate({ contactPending: "", from: "", to: "", page: 1 })}
        >
          Limpar filtros
        </Button>
      </div>

      {error ? (
        <ErrorState title="Não foi possível carregar os visitantes" onRetry={() => void reload()}>
          Tente novamente em instantes.
        </ErrorState>
      ) : null}

      {loading && rows.length === 0 ? (
        <div aria-label="Carregando visitantes">
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
        </div>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <EmptyState title="Nenhum visitante encontrado">
          Não há visitantes registrados no período.
        </EmptyState>
      ) : null}

      {rows.length > 0 ? (
        <>
          <Table<VisitorReportItem>
            rowKey={(item) => `${item.person.id}-${item.meetingDate}`}
            columns={[
              { key: "name", header: "Nome", render: (item) => item.person.fullName },
              { key: "cell", header: "Célula", render: (item) => `${item.cell.code} — ${item.cell.name}` },
              { key: "date", header: "Data", render: (item) => new Date(item.meetingDate).toLocaleDateString("pt-BR") },
              { key: "invitedBy", header: "Convidado por", render: (item) => item.invitedBy?.fullName ?? "—" },
              { key: "contact", header: "Contato", render: (item) => (item.contactPending ? "Pendente" : "Realizado") },
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