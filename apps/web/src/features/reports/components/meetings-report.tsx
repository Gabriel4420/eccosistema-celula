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
import { getMeetingsReport } from "@/src/features/reports/api/reports-api";
import type { MeetingsReportItem } from "@mission-atos/contracts";
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
  const { t, locale } = useI18n();
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
            {t("reports.meetings.pageTitle")}
          </h1>
          <p className="page-description">
            {t("reports.meetings.page.description")}
          </p>
        </div>
        <ExportButton reportType="meetings" params={exportParams} />
      </div>

      <div className="toolbar">
        <SelectField
          label={t("reports.meetings.filter.period")}
          name="period"
          value={periodValue(params)}
          onChange={(event) =>
            navigate({ ...splitPeriod(event.target.value), page: 1 })
          }
          options={getPeriodOptions(t)}
        />
        <SelectField
          label={t("reports.meetings.filter.status")}
          name="status"
          value={params.status}
          onChange={(event) => navigate({ status: event.target.value, page: 1 })}
          options={[
            { value: "", label: t("reports.meetings.filter.all") },
            { value: "SCHEDULED", label: t("reports.meetings.status.scheduled") },
            { value: "COMPLETED", label: t("reports.meetings.status.completed") },
            { value: "CANCELED", label: t("reports.meetings.status.canceled") },
          ]}
        />
        <Button
          variant="secondary"
          icon={FilterX}
          onClick={() => navigate({ status: "", from: "", to: "", page: 1 })}
        >
          {t("reports.meetings.action.clearFilters")}
        </Button>
      </div>

      {error ? (
        <ErrorState title={t("reports.meetings.error")} onRetry={() => void reload()}>
          {t("reports.meetings.error.retry")}
        </ErrorState>
      ) : null}

      {loading && rows.length === 0 ? (
        <div aria-label={t("reports.meetings.loading")}>
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
        </div>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <EmptyState title={t("reports.meetings.emptyState")}>
          {t("reports.meetings.emptyState.desc")}
        </EmptyState>
      ) : null}

      {rows.length > 0 ? (
        <>
          <Table<MeetingsReportItem>
            rowKey={(item) => `${item.cell.id}-${item.meetingDate}`}
            columns={[
              { key: "cell", header: t("reports.meetings.column.cell"), render: (item) => `${item.cell.code} — ${item.cell.name}` },
              { key: "date", header: t("reports.meetings.column.date"), render: (item) => new Date(item.meetingDate).toLocaleDateString(locale) },
              { key: "status", header: t("reports.meetings.column.status"), render: (item) => formatMeetingStatus(item.status, t) },
              { key: "present", header: t("reports.meetings.column.present"), render: (item) => item.presentCount },
              { key: "absent", header: t("reports.meetings.column.absent"), render: (item) => item.absentCount },
              { key: "visitors", header: t("reports.meetings.column.visitors"), render: (item) => item.visitorCount },
              { key: "rate", header: t("reports.meetings.column.rate"), render: (item) => (item.attendanceRate !== null ? `${item.attendanceRate}%` : "—") },
              { key: "report", header: t("reports.meetings.column.report"), render: (item) => formatReportStatus(item.reportStatus, t) },
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

function formatMeetingStatus(status: string, t: (key: TranslationKey) => string): string {
  const map: Record<string, TranslationKey> = {
    SCHEDULED: "reports.meetings.status.scheduled",
    COMPLETED: "reports.meetings.status.completed",
    CANCELED: "reports.meetings.status.canceled",
  };
  return map[status] ? t(map[status]) : status;
}

function formatReportStatus(status: string | null, t: (key: TranslationKey) => string): string {
  if (!status) return "—";
  const map: Record<string, TranslationKey> = {
    NOT_STARTED: "reports.meetings.reportStatus.notStarted",
    DRAFT: "reports.meetings.reportStatus.draft",
    SUBMITTED: "reports.meetings.reportStatus.submitted",
    RETURNED: "reports.meetings.reportStatus.returned",
    CANCELED: "reports.meetings.reportStatus.cancelled",
  };
  const key = map[status];
  return key ? t(key) : status;
}
