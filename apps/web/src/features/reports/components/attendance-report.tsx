"use client";

import Link from "next/link";
import { FilterX } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AttendanceSummaryItem } from "@mission-atos/contracts";

type AttendanceHealthBand = NonNullable<AttendanceSummaryItem["healthBand"]>;
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
import { getAttendanceSummary } from "@/src/features/reports/api/reports-api";
import { ExportButton } from "./export-button";

const PAGE_SIZE = 20;
const REPORTS_CACHE = "reports";

interface AttendanceParams {
  readonly page: number;
  readonly health: AttendanceHealthBand | "";
  readonly from: string;
  readonly to: string;
}

function readParams(searchParams: URLSearchParams): AttendanceParams {
  const requestedPage = Number(searchParams.get("page") ?? "1");
  const health = searchParams.get("health");
  const validHealth = health === "healthy" || health === "attention" || health === "critical";
  return {
    page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    health: validHealth ? health : "",
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
  };
}

function toQuery(params: AttendanceParams): string {
  const next = new URLSearchParams();
  if (params.page > 1) next.set("page", String(params.page));
  if (params.health) next.set("health", params.health);
  if (params.from) next.set("from", params.from);
  if (params.to) next.set("to", params.to);
  const value = next.toString();
  return value ? `?${value}` : "";
}

export function AttendanceReport() {
  const { api } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = readParams(searchParams);

  const navigate = (next: Partial<AttendanceParams>) => {
    router.push(`/reports/attendance${toQuery({ ...params, ...next })}`);
  };

  const period = params.from && params.to ? { from: params.from, to: params.to } : {};

  const {
    data: page,
    loading,
    error,
    reload,
  } = useRemoteQuery({
    fetcher: () =>
      getAttendanceSummary(api, {
        page: params.page,
        pageSize: PAGE_SIZE,
        health: params.health || undefined,
        ...period,
      }),
    cacheName: REPORTS_CACHE,
    cacheKey: `attendance:page:${params.page}:health:${params.health}:from:${params.from}:to:${params.to}`,
    ttlMs: 30_000,
  });

  const rows = (page?.data as readonly AttendanceSummaryItem[] | undefined) ?? [];

  const exportParams: Record<string, string> = {};
  if (params.health) exportParams.health = params.health;
  if (params.from) exportParams.from = params.from;
  if (params.to) exportParams.to = params.to;

  return (
    <section aria-labelledby="attendance-report-title">
      <div className="page-header w-full">
        <div className="flex flex-col">
          <h1 className="page-title" id="attendance-report-title">
            Frequência
          </h1>
          <p className="page-description">
            Resumo de frequência por célula no período.
          </p>
        </div>
        <ExportButton reportType="attendance" params={exportParams} />
      </div>

      <div className="toolbar">
        <SelectField
          label="Período"
          name="period"
          value={params.from && params.to ? `${params.from}..${params.to}` : ""}
          onChange={(event) => {
            const value = event.target.value;
            if (!value) {
              navigate({ from: "", to: "", page: 1 });
              return;
            }
            const [from, to] = value.split("..");
            navigate({ from, to, page: 1 });
          }}
          options={[
            { value: "", label: "Últimos 30 dias" },
            { value: `${d(daysAgo(30))}..${d(today())}`, label: "Últimos 30 dias" },
            { value: `${d(daysAgo(60))}..${d(today())}`, label: "Últimos 60 dias" },
            { value: `${d(monthStart())}..${d(today())}`, label: "Este mês" },
          ]}
        />
        <SelectField
          label="Saúde"
          name="health"
          value={params.health}
          onChange={(event) =>
            navigate({ health: event.target.value as AttendanceParams["health"], page: 1 })
          }
          options={[
            { value: "", label: "Todas" },
            { value: "healthy", label: "Saudável" },
            { value: "attention", label: "Atenção" },
            { value: "critical", label: "Crítico" },
          ]}
        />
        <Button
          variant="secondary"
          icon={FilterX}
          onClick={() => navigate({ health: "", from: "", to: "", page: 1 })}
        >
          Limpar filtros
        </Button>
      </div>

      {error ? (
        <ErrorState title="Não foi possível carregar a frequência" onRetry={() => void reload()}>
          Tente novamente em instantes.
        </ErrorState>
      ) : null}

      {loading && rows.length === 0 ? (
        <div aria-label="Carregando frequência">
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
        </div>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <EmptyState title="Nenhum dado de frequência">
          Não há encontros concluídos no período.
        </EmptyState>
      ) : null}

      {rows.length > 0 ? (
        <>
          <Table<AttendanceSummaryItem>
            rowKey={(item) => item.cell.id}
            columns={[
              {
                key: "cell",
                header: "Célula",
                render: (item) => (
                  <Link
                    href={`/reports/attendance/${item.cell.id}`}
                    style={{ color: "var(--color-primary)" }}
                  >
                    {item.cell.code} — {item.cell.name}
                  </Link>
                ),
              },
              {
                key: "leader",
                header: "Líder",
                render: (item) =>
                  item.leader ? `${item.leader.firstName} ${item.leader.lastName}` : "—",
              },
              {
                key: "meetings",
                header: "Encontros",
                render: (item) => item.totalMeetings,
              },
              {
                key: "rate",
                header: "Frequência",
                render: (item) => (item.attendanceRate !== null ? `${item.attendanceRate}%` : "—"),
              },
              {
                key: "average",
                header: "Média presentes",
                render: (item) => item.averagePresent,
              },
              {
                key: "visitors",
                header: "Visitantes",
                render: (item) => item.totalVisitors,
              },
              {
                key: "health",
                header: "Saúde",
                render: (item) => formatHealthBand(item.healthBand),
              },
            ]}
            rows={rows}
          />
          <Pagination
            page={page?.meta.page ?? 1}
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

function formatHealthBand(band: AttendanceHealthBand | null): string {
  if (band === "healthy") return "Saudável";
  if (band === "attention") return "Atenção";
  if (band === "critical") return "Crítico";
  return "—";
}

function today(): Date {
  return new Date();
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function monthStart(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function d(date: Date): string {
  return date.toISOString().slice(0, 10);
}