"use client";

import Link from "next/link";
import { FilterX, Plus, Upload } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  EmptyState,
  ErrorState,
  Pagination,
  SelectField,
  Skeleton,
  Table,
  TextField,
} from "@/src/shared/components";
import { Can } from "@/src/shared/auth/guards";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { listCells } from "@/src/features/cells/api/cells-api";
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { CellResponse } from "@mission-atos/contracts";
import { CellStatusBadge } from "./cell-status-badge";
import { formatCellDay } from "@/src/features/cells/lib/format";

const PAGE_SIZE = 20;
const CELLS_CACHE = "cells";

interface CellsParams {
  readonly page: number;
  readonly search: string;
  readonly status: "FORMING" | "ACTIVE" | "SUSPENDED" | "CLOSED" | "";
}

function readParams(searchParams: URLSearchParams): CellsParams {
  const status = searchParams.get("status");
  const requestedPage = Number(searchParams.get("page") ?? "1");
  return {
    page:
      Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    search: searchParams.get("search") ?? "",
    status:
      status === "FORMING" ||
      status === "ACTIVE" ||
      status === "SUSPENDED" ||
      status === "CLOSED"
        ? status
        : "",
  };
}

function toQuery(params: CellsParams): string {
  const next = new URLSearchParams();
  if (params.page > 1) next.set("page", String(params.page));
  if (params.search) next.set("search", params.search);
  if (params.status) next.set("status", params.status);
  const value = next.toString();
  return value ? `?${value}` : "";
}

export function CellsList() {
  const { t } = useI18n();
  const { api } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = readParams(searchParams);

  const {
    data: page,
    loading,
    error,
    reload,
  } = useRemoteQuery({
    fetcher: () =>
      listCells(api, {
        page: params.page,
        pageSize: PAGE_SIZE,
        search: params.search || undefined,
        status: params.status || undefined,
      }),
    cacheName: CELLS_CACHE,
    cacheKey: `page:${params.page}:search:${params.search}:status:${params.status}`,
    ttlMs: 20_000,
  });

  const [searchInput, setSearchInput] = useState(params.search);
  const searchTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    },
    [],
  );

  const navigate = (next: Partial<CellsParams>) => {
    router.push(`/cells${toQuery({ ...params, ...next })}`);
  };

  const rows = page?.data ?? [];

  return (
    <section aria-labelledby="cells-title">
      <div className="page-header w-full">
        <div className="flex flex-col">
          <h1 className="page-title" id="cells-title">
            {t("cells.page.title")}
          </h1>
          <p className="page-description">
            {t("cells.page.subtitle")}
          </p>
        </div>
        <Can capability="createCells">
          <div className="flex flex-wrap gap-2">
            <Link className="button button--secondary" href="/cells/import">
              <Upload aria-hidden="true" className="button__icon" />
              {t("cells.import")}
            </Link>
            <Link className="button" href="/cells/new">
              <Plus aria-hidden="true" className="button__icon" />
              {t("cells.new")}
            </Link>
          </div>
        </Can>
      </div>

      <div className="toolbar">
        <TextField
          label={t("common.search")}
          name="search"
          value={searchInput}
          onChange={(event) => {
            const value = event.target.value;
            setSearchInput(value);
            if (searchTimer.current) window.clearTimeout(searchTimer.current);
            searchTimer.current = window.setTimeout(() => {
              navigate({ search: value, page: 1 });
            }, 300);
          }}
          hint={t("cells.search.hint")}
        />
        <SelectField
          label={t("common.status")}
          name="status"
          value={params.status}
          onChange={(event) =>
            navigate({
              status: event.target.value as CellsParams["status"],
              page: 1,
            })
          }
          options={[
            { value: "", label: t("cells.filter.allStatuses") },
            { value: "FORMING", label: t("cells.status.formative") },
            { value: "ACTIVE", label: t("cells.status.active") },
            { value: "SUSPENDED", label: t("cells.status.suspended") },
            { value: "CLOSED", label: t("cells.status.closed") },
          ]}
        />
        <Button
          variant="secondary"
          icon={FilterX}
          onClick={() => {
            setSearchInput("");
            navigate({ search: "", status: "", page: 1 });
          }}
        >
          {t("cells.action.clearFilters")}
        </Button>
      </div>

      {error ? (
        <ErrorState
          title={t("cells.error.list")}
          onRetry={() => void reload()}
        >
          {t("cells.error.retry")}
        </ErrorState>
      ) : null}

      {loading && rows.length === 0 ? (
        <div aria-label={t("cells.loading")}>
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
        </div>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <EmptyState title={t("cells.emptyState.title")}>
          {t("cells.emptyState.desc")}
        </EmptyState>
      ) : null}

      {rows.length > 0 ? (
        <>
          <Table<CellResponse>
            rowKey={(cell) => cell.id}
            columns={[
              {
                key: "code",
                header: t("cells.column.code"),
                render: (cell) => (
                  <Link href={`/cells/${cell.id}`}>{cell.code}</Link>
                ),
              },
              {
                key: "name",
                header: t("cells.column.name"),
                render: (cell) => (
                  <Link href={`/cells/${cell.id}`}>{cell.name}</Link>
                ),
              },
              {
                key: "leader",
                header: t("cells.column.leader"),
                render: (cell) => cell.leader?.name ?? "—",
              },
              {
                key: "supervisor",
                header: t("cells.column.supervisor"),
                render: (cell) => cell.supervisor?.name ?? "—",
              },
              {
                key: "meeting",
                header: t("cells.column.meeting"),
                render: (cell) =>
                  t("cells.detail.meetingAt", {
                    day: formatCellDay(cell.meetingDay, t),
                    time: cell.meetingTime,
                  }),
              },
              {
                key: "status",
                header: t("common.status"),
                render: (cell) => <CellStatusBadge status={cell.status} />,
              },
              {
                key: "actions",
                header: t("common.actions"),
                render: (cell) => (
                  <span className="table__actions">
                    <Link
                      className="button button--secondary button--sm"
                      href={`/cells/${cell.id}`}
                    >
                      {t("cells.action.viewDetails")}
                    </Link>
                  </span>
                ),
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
