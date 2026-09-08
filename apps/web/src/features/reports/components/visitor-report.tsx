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
import { getVisitorReport } from "@/src/features/reports/api/reports-api";
import type { VisitorReportItem } from "@mission-atos/contracts";
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
  const { t, locale } = useI18n();
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
            {t("reports.visitors.pageTitle")}
          </h1>
          <p className="page-description">
            {t("reports.visitors.page.description")}
          </p>
        </div>
        <ExportButton reportType="visitors" params={exportParams} />
      </div>

      {metrics ? (
        <div className="stat-cards">
          <div className="stat-card">
            <span className="stat-card__label">{t("reports.visitors.metric.total")}</span>
            <span className="stat-card__value">{metrics.total}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">{t("reports.visitors.metric.pending")}</span>
            <span className="stat-card__value">{metrics.contactPendingCount}</span>
          </div>
          {metrics.topCell ? (
            <div className="stat-card">
              <span className="stat-card__label">{t("reports.visitors.metric.topCell")}</span>
              <span className="stat-card__value">
                {metrics.topCell.code} ({metrics.topCell.count})
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="toolbar">
        <SelectField
          label={t("reports.visitors.filter.period")}
          name="period"
          value={periodValue(params)}
          onChange={(event) =>
            navigate({ ...splitPeriod(event.target.value), page: 1 })
          }
          options={getPeriodOptions(t)}
        />
        <SelectField
          label={t("reports.visitors.filter.contact")}
          name="contactPending"
          value={params.contactPending}
          onChange={(event) => navigate({ contactPending: event.target.value, page: 1 })}
          options={[
            { value: "", label: t("reports.visitors.filter.all") },
            { value: "true", label: t("reports.visitors.status.pending") },
            { value: "false", label: t("reports.visitors.status.done") },
          ]}
        />
        <Button
          variant="secondary"
          icon={FilterX}
          onClick={() => navigate({ contactPending: "", from: "", to: "", page: 1 })}
        >
          {t("reports.visitors.action.clearFilters")}
        </Button>
      </div>

      {error ? (
        <ErrorState title={t("reports.visitors.error")} onRetry={() => void reload()}>
          {t("reports.visitors.error.retry")}
        </ErrorState>
      ) : null}

      {loading && rows.length === 0 ? (
        <div aria-label={t("reports.visitors.loading")}>
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
        </div>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <EmptyState title={t("reports.visitors.emptyState")}>
          {t("reports.visitors.emptyState.desc")}
        </EmptyState>
      ) : null}

      {rows.length > 0 ? (
        <>
          <Table<VisitorReportItem>
            rowKey={(item) => `${item.person.id}-${item.meetingDate}`}
            columns={[
              { key: "name", header: t("reports.visitors.column.name"), render: (item) => item.person.fullName },
              { key: "cell", header: t("reports.visitors.column.cell"), render: (item) => `${item.cell.code} — ${item.cell.name}` },
              { key: "date", header: t("reports.visitors.column.date"), render: (item) => new Date(item.meetingDate).toLocaleDateString(locale) },
              { key: "invitedBy", header: t("reports.visitors.column.invitedBy"), render: (item) => item.invitedBy?.fullName ?? "—" },
              { key: "contact", header: t("reports.visitors.column.contact"), render: (item) => (item.contactPending ? t("reports.visitors.status.pending") : t("reports.visitors.status.done")) },
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
