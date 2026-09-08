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
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { TranslationKey } from "@/src/shared/i18n/dictionaries";
import { getPendingReports } from "@/src/features/reports/api/reports-api";
import type { PendingReportItem } from "@mission-atos/contracts";
import { ExportButton } from "./export-button";
import {
  getPeriodOptions,
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
  const { t, locale } = useI18n();
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
            {t("reports.pending.pageTitle")}
          </h1>
          <p className="page-description">
            {t("reports.pending.page.description")}
          </p>
        </div>
        <ExportButton reportType="pending" params={exportParams} />
      </div>

      <div className="toolbar">
        <SelectField
          label={t("reports.pending.filter.period")}
          name="period"
          value={periodValue(params)}
          onChange={(event) =>
            navigate({ ...splitPeriod(event.target.value), page: 1 })
          }
          options={getPeriodOptions(t)}
        />
        <SelectField
          label={t("reports.pending.filter.status")}
          name="status"
          value={params.status}
          onChange={(event) => navigate({ status: event.target.value, page: 1 })}
          options={[
            { value: "", label: t("reports.pending.filter.all") },
            { value: "NO_REPORT", label: t("reports.pending.status.noReport") },
            { value: "NOT_STARTED", label: t("reports.pending.status.notStarted") },
            { value: "DRAFT", label: t("reports.pending.status.draft") },
            { value: "RETURNED", label: t("reports.pending.status.returned") },
          ]}
        />
        <Button
          variant="secondary"
          icon={FilterX}
          onClick={() => navigate({ status: "", from: "", to: "", page: 1 })}
        >
          {t("reports.pending.action.clearFilters")}
        </Button>
      </div>

      {error ? (
        <ErrorState title={t("reports.pending.error")} onRetry={() => void reload()}>
          {t("reports.pending.error.retry")}
        </ErrorState>
      ) : null}

      {loading && rows.length === 0 ? (
        <div aria-label={t("reports.pending.loading")}>
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
        </div>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <EmptyState title={t("reports.pending.emptyState")}>
          {t("reports.pending.emptyState.desc")}
        </EmptyState>
      ) : null}

      {rows.length > 0 ? (
        <>
          <Table<PendingReportItem>
            rowKey={(item) => `${item.cell.id}-${item.meetingDate}`}
            columns={[
              {
                key: "cell",
                header: t("reports.pending.column.cell"),
                render: (item) => `${item.cell.code} — ${item.cell.name}`,
              },
              {
                key: "leader",
                header: t("reports.pending.column.leader"),
                render: (item) =>
                  item.leader ? `${item.leader.firstName} ${item.leader.lastName}` : "—",
              },
              {
                key: "date",
                header: t("reports.pending.column.date"),
                render: (item) => new Date(item.meetingDate).toLocaleDateString(locale),
              },
              {
                key: "days",
                header: t("reports.pending.column.days"),
                render: (item) => item.daysSinceMeeting,
              },
              {
                key: "deadline",
                header: t("reports.pending.column.deadline"),
                render: (item) =>
                  item.overdue ? (
                    <span className="status-badge status-badge--overdue">{t("reports.pending.status.late")}</span>
                  ) : (
                    <span className="status-badge status-badge--ontime">{t("reports.pending.status.onTime")}</span>
                  ),
              },
              {
                key: "status",
                header: t("reports.pending.column.status"),
                render: (item) => formatReportStatus(item.reportStatus, t),
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

function formatReportStatus(status: string, t: (key: TranslationKey) => string): string {
  const map: Record<string, TranslationKey> = {
    NOT_STARTED: "reports.pending.status.notStarted",
    DRAFT: "reports.pending.status.draft",
    SUBMITTED: "reports.pending.status.submitted",
    RETURNED: "reports.pending.status.returned",
  };
  const key = map[status];
  return key ? t(key) : status;
}
