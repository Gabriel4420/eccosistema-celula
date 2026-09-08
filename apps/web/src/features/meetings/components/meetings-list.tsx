"use client";

import Link from "next/link";
import { CalendarPlus, FilterX } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, EmptyState, ErrorState, Pagination, SelectField, Skeleton, Table, TextField } from "@/src/shared/components";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { useI18n } from "@/src/shared/i18n/language-provider";
import { listMeetings } from "@/src/features/meetings/api/meetings-api";
import type { MeetingResponse } from "@mission-atos/contracts";
import { MeetingStatusBadge } from "./meeting-status-badge";
import { formatMeetingDate, formatMeetingTimestamp } from "@/src/features/meetings/lib/format";

const PAGE_SIZE = 20;
const MEETINGS_CACHE = "meetings";

interface MeetingsParams {
  readonly page: number;
  readonly from: string;
  readonly to: string;
  readonly status: "" | "SCHEDULED" | "COMPLETED" | "CANCELED";
}

function readParams(searchParams: URLSearchParams): MeetingsParams {
  const status = searchParams.get("status");
  const requestedPage = Number(searchParams.get("page") ?? "1");
  return {
    page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
    status:
      status === "SCHEDULED" || status === "COMPLETED" || status === "CANCELED"
        ? status
        : ""
  };
}

function toQuery(params: MeetingsParams): string {
  const next = new URLSearchParams();
  if (params.page > 1) next.set("page", String(params.page));
  if (params.from) next.set("from", params.from);
  if (params.to) next.set("to", params.to);
  if (params.status) next.set("status", params.status);
  const value = next.toString();
  return value ? `?${value}` : "";
}

export function MeetingsList({ cellId }: { readonly cellId: string }) {
  const { t, locale } = useI18n();
  const { api, capabilities } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = readParams(searchParams);

  const { data: page, loading, error, reload } = useRemoteQuery({
    fetcher: () =>
      listMeetings(api, cellId, {
        page: params.page,
        pageSize: PAGE_SIZE,
        from: params.from || undefined,
        to: params.to || undefined,
        status: params.status || undefined,
        sortOrder: "desc"
      }),
    cacheName: MEETINGS_CACHE,
    cacheKey: `page:${cellId}:${params.page}:from:${params.from}:to:${params.to}:status:${params.status}`,
    ttlMs: 20_000
  });

  const [fromInput, setFromInput] = useState(params.from);
  const [toInput, setToInput] = useState(params.to);
  const fromTimer = useRef<number | null>(null);
  const toTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (fromTimer.current) window.clearTimeout(fromTimer.current);
      if (toTimer.current) window.clearTimeout(toTimer.current);
    },
    []
  );

  const navigate = (next: Partial<MeetingsParams>) => {
    router.push(`/cells/${cellId}/meetings${toQuery({ ...params, ...next })}`);
  };

  const rows = page?.data ?? [];

  return (
    <section aria-labelledby="meetings-title">
      <div className="page-header">
        <h1 className="page-title" id="meetings-title">
          {t("meetings.page.title")}
        </h1>
        <p className="page-description">
          {t("meetings.page.subtitle")}
        </p>
        {capabilities.createMeetings ? (
          <Link className="button" href={`/cells/${cellId}/meetings/new`}>
            <CalendarPlus aria-hidden="true" className="button__icon" />
            {t("meetings.new")}
          </Link>
        ) : null}
      </div>

      <div className="toolbar">
        <TextField
          label={t("meetings.field.from")}
          name="from"
          type="date"
          value={fromInput}
          onChange={(event) => {
            const value = event.target.value;
            setFromInput(value);
            if (fromTimer.current) window.clearTimeout(fromTimer.current);
            fromTimer.current = window.setTimeout(() => {
              navigate({ from: value, page: 1 });
            }, 300);
          }}
          hint={t("meetings.date.hint")}
        />
        <TextField
          label={t("meetings.field.to")}
          name="to"
          type="date"
          value={toInput}
          onChange={(event) => {
            const value = event.target.value;
            setToInput(value);
            if (toTimer.current) window.clearTimeout(toTimer.current);
            toTimer.current = window.setTimeout(() => {
              navigate({ to: value, page: 1 });
            }, 300);
          }}
          hint={t("meetings.date.hint")}
        />
        <SelectField
          label={t("common.status")}
          name="status"
          value={params.status}
          onChange={(event) => navigate({ status: event.target.value as MeetingsParams["status"], page: 1 })}
          options={[
            { value: "", label: t("meetings.filter.all") },
            { value: "SCHEDULED", label: t("meetings.status.scheduled") },
            { value: "COMPLETED", label: t("meetings.status.completed") },
            { value: "CANCELED", label: t("meetings.status.cancelled") }
          ]}
        />
        <Button
          variant="secondary"
          icon={FilterX}
          onClick={() => {
            setFromInput("");
            setToInput("");
            navigate({ from: "", to: "", status: "", page: 1 });
          }}
        >
          {t("meetings.action.clearFilters")}
        </Button>
      </div>

      {error ? (
        <ErrorState title={t("meetings.error.list")} onRetry={() => void reload()}>
          {t("meetings.error.retry")}
        </ErrorState>
      ) : null}

      {loading && rows.length === 0 ? (
        <div aria-label={t("meetings.loading")}>
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
        </div>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <EmptyState title={t("meetings.emptyState.title")}>
          {t("meetings.emptyState.desc")}
        </EmptyState>
      ) : null}

      {rows.length > 0 ? (
        <>
          <Table<MeetingResponse>
            rowKey={(meeting) => meeting.id}
            columns={[
              {
                key: "meetingDate",
                header: t("meetings.column.date"),
                render: (meeting) => formatMeetingDate(meeting.meetingDate, locale)
              },
              {
                key: "status",
                header: t("common.status"),
                render: (meeting) => <MeetingStatusBadge status={meeting.status} />
              },
              {
                key: "updatedAt",
                header: t("meetings.column.updatedAt"),
                render: (meeting) => formatMeetingTimestamp(meeting.updatedAt, locale)
              },
              {
                key: "actions",
                header: t("common.actions"),
                render: (meeting) => (
                  <span className="table__actions">
                    <Link
                      className="button button--secondary button--sm"
                      href={`/cells/${cellId}/meetings/${meeting.id}`}
                    >
                      {t("meetings.action.viewDetails")}
                    </Link>
                  </span>
                )
              }
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
