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
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { TranslationKey } from "@/src/shared/i18n/dictionaries";
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
  const { t } = useI18n();
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
            {t("reports.attendance.pageTitle")}
          </h1>
          <p className="page-description">
            {t("reports.attendance.page.description")}
          </p>
        </div>
        <ExportButton reportType="attendance" params={exportParams} />
      </div>

      <div className="toolbar">
        <SelectField
          label={t("reports.attendance.filter.period")}
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
            { value: "", label: t("reports.period.last30") },
            { value: `${d(daysAgo(30))}..${d(today())}`, label: t("reports.period.last30") },
            { value: `${d(daysAgo(60))}..${d(today())}`, label: t("reports.period.last60") },
            { value: `${d(monthStart())}..${d(today())}`, label: t("reports.period.thisMonth") },
          ]}
        />
        <SelectField
          label={t("reports.attendance.filter.health")}
          name="health"
          value={params.health}
          onChange={(event) =>
            navigate({ health: event.target.value as AttendanceParams["health"], page: 1 })
          }
          options={[
            { value: "", label: t("reports.attendance.filter.all") },
            { value: "healthy", label: t("reports.attendance.band.healthy") },
            { value: "attention", label: t("reports.attendance.band.attention") },
            { value: "critical", label: t("reports.attendance.band.critical") },
          ]}
        />
        <Button
          variant="secondary"
          icon={FilterX}
          onClick={() => navigate({ health: "", from: "", to: "", page: 1 })}
        >
          {t("reports.attendance.action.clearFilters")}
        </Button>
      </div>

      {error ? (
        <ErrorState title={t("reports.attendance.error")} onRetry={() => void reload()}>
          {t("reports.attendance.error.retry")}
        </ErrorState>
      ) : null}

      {loading && rows.length === 0 ? (
        <div aria-label={t("reports.attendance.loading")}>
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
        </div>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <EmptyState title={t("reports.attendance.emptyState")}>
          {t("reports.attendance.emptyState.desc")}
        </EmptyState>
      ) : null}

      {rows.length > 0 ? (
        <>
          <Table<AttendanceSummaryItem>
            rowKey={(item) => item.cell.id}
            columns={[
              {
                key: "cell",
                header: t("reports.attendance.column.cell"),
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
                header: t("reports.attendance.column.leader"),
                render: (item) =>
                  item.leader ? `${item.leader.firstName} ${item.leader.lastName}` : "—",
              },
              {
                key: "meetings",
                header: t("reports.attendance.column.meetings"),
                render: (item) => item.totalMeetings,
              },
              {
                key: "rate",
                header: t("reports.attendance.column.rate"),
                render: (item) => (item.attendanceRate !== null ? `${item.attendanceRate}%` : "—"),
              },
              {
                key: "average",
                header: t("reports.attendance.column.average"),
                render: (item) => item.averagePresent,
              },
              {
                key: "visitors",
                header: t("reports.attendance.column.visitors"),
                render: (item) => item.totalVisitors,
              },
              {
                key: "health",
                header: t("reports.attendance.column.health"),
                render: (item) => formatHealthBand(item.healthBand, t),
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

function formatHealthBand(band: AttendanceHealthBand | null, t: (key: TranslationKey) => string): string {
  const map: Record<AttendanceHealthBand, TranslationKey> = {
    healthy: "reports.attendance.band.healthy",
    attention: "reports.attendance.band.attention",
    critical: "reports.attendance.band.critical",
  };
  if (!band) return "—";
  return t(map[band]);
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