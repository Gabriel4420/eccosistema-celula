"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { AttendanceDetailItem } from "@mission-atos/contracts";
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
import { getAttendanceDetail } from "@/src/features/reports/api/reports-api";
import { ExportButton } from "./export-button";

const PAGE_SIZE = 20;
const REPORTS_CACHE = "reports";

interface DetailParams {
  readonly page: number;
  readonly from: string;
  readonly to: string;
}

function readParams(searchParams: URLSearchParams): DetailParams {
  const requestedPage = Number(searchParams.get("page") ?? "1");
  return {
    page:
      Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
  };
}

function toQuery(prefix: string, params: DetailParams): string {
  const next = new URLSearchParams();
  if (params.page > 1) next.set("page", String(params.page));
  if (params.from) next.set("from", params.from);
  if (params.to) next.set("to", params.to);
  const value = next.toString();
  return `${prefix}${value ? `?${value}` : ""}`;
}

export function AttendanceDetail({ cellId }: { readonly cellId: string }) {
  const { api } = useSession();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = readParams(searchParams);

  const navigate = (next: Partial<DetailParams>) => {
    router.push(
      toQuery(`/reports/attendance/${cellId}`, { ...params, ...next }),
    );
  };

  const {
    data: page,
    loading,
    error,
    reload,
  } = useRemoteQuery({
    fetcher: () =>
      getAttendanceDetail(api, {
        cellId,
        page: params.page,
        pageSize: PAGE_SIZE,
        ...(params.from && params.to
          ? { from: params.from, to: params.to }
          : {}),
      }),
    cacheName: REPORTS_CACHE,
    cacheKey: `attendance-detail:${cellId}:page:${params.page}:from:${params.from}:to:${params.to}`,
    ttlMs: 30_000,
  });

  const rows = (page?.data as readonly AttendanceDetailItem[] | undefined) ?? [];

  return (
    <section aria-labelledby="attendance-detail-title">
      <div className="page-header w-full">
        <div className="flex flex-col">
          <p className="page-description">
            <Link href="/reports/attendance" style={{ color: "var(--color-primary)" }}>
              {t("reports.attendance.pageTitle")}
            </Link>{" "}
            / {t("reports.attendanceDetail.page.crumb")}
          </p>
          <h1 className="page-title" id="attendance-detail-title">
            {t("reports.attendanceDetail.pageTitle")}
          </h1>
        </div>
        <ExportButton
          reportType="attendance"
          params={{
            ...(params.from ? { from: params.from } : {}),
            ...(params.to ? { to: params.to } : {}),
            ...(cellId ? { cellId } : {}),
          }}
        />
      </div>

      <div className="toolbar">
        <SelectField
          label={t("reports.attendanceDetail.filter.period")}
          name="period"
          value={
            params.from && params.to ? `${params.from}..${params.to}` : ""
          }
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
            { value: "", label: t("reports.period.default") },
            { value: d(daysAgo(30)) + ".." + d(today()), label: t("reports.period.last30") },
            { value: d(daysAgo(60)) + ".." + d(today()), label: t("reports.period.last60") },
            { value: d(monthStart()) + ".." + d(today()), label: t("reports.period.thisMonth") },
          ]}
        />
        <Button
          variant="secondary"
          onClick={() => navigate({ page: 1 })}
        >
          {t("reports.attendanceDetail.action.reload")}
        </Button>
      </div>

      {error ? (
        <ErrorState title={t("reports.attendanceDetail.error")} onRetry={() => void reload()}>
          {t("reports.attendanceDetail.error.retry")}
        </ErrorState>
      ) : null}

      {loading && rows.length === 0 ? (
        <div aria-label={t("reports.attendanceDetail.loading")}>
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
        </div>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <EmptyState title={t("reports.attendanceDetail.emptyState")}>
          {t("reports.attendanceDetail.emptyState.desc")}
        </EmptyState>
      ) : null}

      {rows.length > 0 ? (
        <>
          <Table<AttendanceDetailItem>
            rowKey={(item) => item.person.id}
            columns={[
              { key: "name", header: t("reports.attendanceDetail.column.person"), render: (item) => item.person.fullName },
              { key: "present", header: t("reports.attendanceDetail.column.present"), render: (item) => item.totalPresent },
              { key: "absent", header: t("reports.attendanceDetail.column.absent"), render: (item) => item.totalAbsent },
              { key: "excused", header: t("reports.attendanceDetail.column.excused"), render: (item) => item.totalExcused },
              {
                key: "rate",
                header: t("reports.attendanceDetail.column.rate"),
                render: (item) => (item.attendanceRate !== null ? `${item.attendanceRate}%` : "—"),
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
