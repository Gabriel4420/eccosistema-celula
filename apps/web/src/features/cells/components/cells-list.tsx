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
import {
  listCells,
  listCellAssignmentOptions,
  type CellMeetingDay,
} from "@/src/features/cells/api/cells-api";
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { CellAssignmentOption, CellResponse } from "@mission-atos/contracts";
import { CellStatusBadge } from "./cell-status-badge";
import { DAY_KEYS, formatCellDay } from "@/src/features/cells/lib/format";

const PAGE_SIZE = 20;
const CELLS_CACHE = "cells";
const OPTIONS_PAGE_SIZE = 100;
const NUMBER_FILTER_DEBOUNCE_MS = 400;
const MEETING_DAYS: ReadonlyArray<CellMeetingDay> = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

interface CellsParams {
  readonly page: number;
  readonly search: string;
  readonly status: "FORMING" | "ACTIVE" | "SUSPENDED" | "CLOSED" | "";
  readonly leaderId: string;
  readonly supervisorId: string;
  readonly meetingDay: CellMeetingDay | "";
  readonly minMembers: string;
  readonly maxMembers: string;
}

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const UNSIGNED_INT_PATTERN = /^\d+$/;

function readMembersValue(value: string | null): string {
  return value && UNSIGNED_INT_PATTERN.test(value) ? value : "";
}

function readParams(searchParams: URLSearchParams): CellsParams {
  const status = searchParams.get("status");
  const leaderId = searchParams.get("leaderId") ?? "";
  const supervisorId = searchParams.get("supervisorId") ?? "";
  const meetingDay = searchParams.get("meetingDay");
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
    leaderId: UUID_PATTERN.test(leaderId) ? leaderId : "",
    supervisorId: UUID_PATTERN.test(supervisorId) ? supervisorId : "",
    meetingDay: MEETING_DAYS.includes(meetingDay as CellMeetingDay)
      ? (meetingDay as CellMeetingDay)
      : "",
    minMembers: readMembersValue(searchParams.get("minMembers")),
    maxMembers: readMembersValue(searchParams.get("maxMembers")),
  };
}

function toQuery(params: CellsParams): string {
  const next = new URLSearchParams();
  if (params.page > 1) next.set("page", String(params.page));
  if (params.search) next.set("search", params.search);
  if (params.status) next.set("status", params.status);
  if (params.leaderId) next.set("leaderId", params.leaderId);
  if (params.supervisorId) next.set("supervisorId", params.supervisorId);
  if (params.meetingDay) next.set("meetingDay", params.meetingDay);
  if (params.minMembers) next.set("minMembers", params.minMembers);
  if (params.maxMembers) next.set("maxMembers", params.maxMembers);
  const value = next.toString();
  return value ? `?${value}` : "";
}

function toNumberOrUndefined(value: string): number | undefined {
  return value ? Number(value) : undefined;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function CellsList() {
  const { t } = useI18n();
  const { api } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = readParams(searchParams);

  const [leaderOptions, setLeaderOptions] = useState<readonly CellAssignmentOption[]>([]);
  const [supervisorOptions, setSupervisorOptions] = useState<readonly CellAssignmentOption[]>([]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      listCellAssignmentOptions(api, { kind: "LEADER", page: 1, pageSize: OPTIONS_PAGE_SIZE }),
      listCellAssignmentOptions(api, { kind: "SUPERVISOR", page: 1, pageSize: OPTIONS_PAGE_SIZE }),
    ])
      .then(([leaders, supervisors]) => {
        if (!active) return;
        setLeaderOptions(leaders);
        setSupervisorOptions(supervisors);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [api]);

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
        leaderId: params.leaderId || undefined,
        supervisorId: params.supervisorId || undefined,
        meetingDay: params.meetingDay || undefined,
        minMembers: toNumberOrUndefined(params.minMembers),
        maxMembers: toNumberOrUndefined(params.maxMembers),
      }),
    cacheName: CELLS_CACHE,
    cacheKey: `page:${params.page}:search:${params.search}:status:${params.status}:leader:${params.leaderId}:supervisor:${params.supervisorId}:day:${params.meetingDay}:min:${params.minMembers}:max:${params.maxMembers}`,
    ttlMs: 20_000,
  });

  const [searchInput, setSearchInput] = useState(params.search);
  const [minInput, setMinInput] = useState(params.minMembers);
  const [maxInput, setMaxInput] = useState(params.maxMembers);
  const searchTimer = useRef<number | null>(null);
  const minTimer = useRef<number | null>(null);
  const maxTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
      if (minTimer.current) window.clearTimeout(minTimer.current);
      if (maxTimer.current) window.clearTimeout(maxTimer.current);
    },
    [],
  );

  const navigate = (next: Partial<CellsParams>) => {
    router.push(`/cells${toQuery({ ...params, ...next })}`);
  };

  const rows = page?.data ?? [];

  const clearFilters = () => {
    setSearchInput("");
    setMinInput("");
    setMaxInput("");
    navigate({
      search: "",
      status: "",
      leaderId: "",
      supervisorId: "",
      meetingDay: "",
      minMembers: "",
      maxMembers: "",
      page: 1,
    });
  };

  const renderPerson = (person: { name: string } | null) =>
    person ? (
      <span className="cell-person">
        <span className="cell-person__avatar" aria-hidden="true">
          {initials(person.name)}
        </span>
        <span className="cell-person__name">{person.name}</span>
      </span>
    ) : (
      <span className="cell-person cell-person--empty">—</span>
    );

  return (
    <section className="cells-page" aria-labelledby="cells-title">
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
        <Button variant="secondary" icon={FilterX} onClick={clearFilters}>
          {t("cells.action.clearFilters")}
        </Button>
      </div>

      <div className="toolbar" aria-label={t("cells.filter.filtersAria")}>
        <SelectField
          label={t("cells.filter.leader")}
          name="leader"
          value={params.leaderId}
          onChange={(event) => navigate({ leaderId: event.target.value, page: 1 })}
          options={[
            { value: "", label: t("cells.filter.allLeaders") },
            ...leaderOptions.map((option) => ({ value: option.id, label: option.name })),
          ]}
        />
        <SelectField
          label={t("cells.filter.supervisor")}
          name="supervisor"
          value={params.supervisorId}
          onChange={(event) => navigate({ supervisorId: event.target.value, page: 1 })}
          options={[
            { value: "", label: t("cells.filter.allSupervisors") },
            ...supervisorOptions.map((option) => ({ value: option.id, label: option.name })),
          ]}
        />
        <SelectField
          label={t("cells.filter.meetingDay")}
          name="meetingDay"
          value={params.meetingDay}
          onChange={(event) =>
            navigate({
              meetingDay: event.target.value as CellsParams["meetingDay"],
              page: 1,
            })
          }
          options={[
            { value: "", label: t("cells.filter.allDays") },
            ...MEETING_DAYS.map((day) => ({ value: day, label: t(DAY_KEYS[day]) })),
          ]}
        />
        <TextField
          label={t("cells.filter.minMembers")}
          name="minMembers"
          type="number"
          min="0"
          inputMode="numeric"
          value={minInput}
          onChange={(event) => {
            const value = event.target.value;
            setMinInput(value);
            if (minTimer.current) window.clearTimeout(minTimer.current);
            minTimer.current = window.setTimeout(() => {
              navigate({ minMembers: readMembersValue(value), page: 1 });
            }, NUMBER_FILTER_DEBOUNCE_MS);
          }}
        />
        <TextField
          label={t("cells.filter.maxMembers")}
          name="maxMembers"
          type="number"
          min="0"
          inputMode="numeric"
          value={maxInput}
          onChange={(event) => {
            const value = event.target.value;
            setMaxInput(value);
            if (maxTimer.current) window.clearTimeout(maxTimer.current);
            maxTimer.current = window.setTimeout(() => {
              navigate({ maxMembers: readMembersValue(value), page: 1 });
            }, NUMBER_FILTER_DEBOUNCE_MS);
          }}
        />
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
                className: "cells-table__cell-code",
                render: (cell) => (
                  <Link className="cell-code" href={`/cells/${cell.id}`}>
                    {cell.code}
                  </Link>
                ),
              },
              {
                key: "name",
                header: t("cells.column.name"),
                className: "cells-table__cell-name",
                render: (cell) => (
                  <Link className="cell-name" href={`/cells/${cell.id}`}>
                    {cell.name}
                  </Link>
                ),
              },
              {
                key: "leader",
                header: t("cells.column.leader"),
                render: (cell) => renderPerson(cell.leader),
              },
              {
                key: "supervisor",
                header: t("cells.column.supervisor"),
                render: (cell) => renderPerson(cell.supervisor),
              },
              {
                key: "members",
                header: t("cells.column.members"),
                className: "cells-table__cell-members",
                render: (cell) => (
                  <span className="cell-members-count">{cell.memberCount}</span>
                ),
              },
              {
                key: "meeting",
                header: t("cells.column.meeting"),
                render: (cell) => (
                  <span className="cell-meeting">
                    <span className="cell-meeting__day">
                      {formatCellDay(cell.meetingDay, t)}
                    </span>
                    <span className="cell-meeting__time">{cell.meetingTime}</span>
                  </span>
                ),
              },
              {
                key: "status",
                header: t("common.status"),
                className: "cells-table__cell-status",
                render: (cell) => <CellStatusBadge status={cell.status} />,
              },
              {
                key: "actions",
                header: t("common.actions"),
                className: "cells-table__cell-actions",
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