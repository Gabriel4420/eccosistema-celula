"use client";

import Link from "next/link";
import { Eye, FilterX, Upload, UserRoundPlus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { PersonResponse } from "@mission-atos/contracts";
import {
  Alert,
  Button,
  EmptyState,
  ErrorState,
  Pagination,
  SelectField,
  Skeleton,
  StatusBadge,
  Table,
  TextField,
} from "@/src/shared/components";
import { Can } from "@/src/shared/auth/guards";
import { cacheStore } from "@/src/shared/cache/cache";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { toast } from "@/src/shared/toast/toast-store";
import { useI18n } from "@/src/shared/i18n/language-provider";
import {
  listPeople,
  updatePersonStatus,
} from "@/src/features/people/api/people-api";
import { formatPhone } from "@/src/features/people/lib/format";
import { formatDateBR } from "@/src/features/people/lib/date";

const PAGE_SIZE = 20;
const PEOPLE_CACHE = "people";

type PersonSortBy = "fullName" | "birthDate" | "createdAt";
type PersonSortOrder = "asc" | "desc";

type PersonSortValue =
  | "fullName:asc"
  | "fullName:desc"
  | "birthDate:desc"
  | "birthDate:asc"
  | "createdAt:desc"
  | "createdAt:asc";

interface PersonSortCriteria {
  readonly sortBy: PersonSortBy;
  readonly sortOrder: PersonSortOrder;
}

const PERSON_SORT_FIELDS: Record<PersonSortValue, PersonSortCriteria> = {
  "fullName:asc": { sortBy: "fullName", sortOrder: "asc" },
  "fullName:desc": { sortBy: "fullName", sortOrder: "desc" },
  "birthDate:desc": { sortBy: "birthDate", sortOrder: "desc" },
  "birthDate:asc": { sortBy: "birthDate", sortOrder: "asc" },
  "createdAt:desc": { sortBy: "createdAt", sortOrder: "desc" },
  "createdAt:asc": { sortBy: "createdAt", sortOrder: "asc" }
};

const DEFAULT_SORT: PersonSortValue = "fullName:asc";

function isPersonSortValue(value: string): value is PersonSortValue {
  return value in PERSON_SORT_FIELDS;
}

interface PeopleParams {
  readonly page: number;
  readonly search: string;
  readonly status: "ACTIVE" | "INACTIVE" | "";
  readonly gender: string;
  readonly sort: PersonSortValue;
}

function readParams(searchParams: URLSearchParams): PeopleParams {
  const status = searchParams.get("status");
  const requestedPage = Number(searchParams.get("page") ?? "1");
  const sort = searchParams.get("sort");
  return {
    page:
      Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    search: searchParams.get("search") ?? "",
    status: status === "ACTIVE" || status === "INACTIVE" ? status : "",
    gender: searchParams.get("gender") ?? "",
    sort: sort !== null && isPersonSortValue(sort) ? sort : DEFAULT_SORT
  };
}

function toQuery(params: PeopleParams): string {
  const next = new URLSearchParams();
  if (params.page > 1) next.set("page", String(params.page));
  if (params.search) next.set("search", params.search);
  if (params.status) next.set("status", params.status);
  if (params.gender) next.set("gender", params.gender);
  if (params.sort !== DEFAULT_SORT) next.set("sort", params.sort);
  const value = next.toString();
  return value ? `?${value}` : "";
}

export function PeopleList() {
  const { t } = useI18n();
  const { api, capabilities } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = readParams(searchParams);
  const canListInactive = capabilities.listInactivePeople;
  const effectiveStatus =
    !canListInactive && params.status === "INACTIVE" ? "" : params.status;

  const {
    data: page,
    loading,
    error,
    reload,
  } = useRemoteQuery({
    fetcher: () =>
      listPeople(api, {
        page: params.page,
        pageSize: PAGE_SIZE,
        search: params.search || undefined,
        status: effectiveStatus || undefined,
        gender: params.gender || undefined,
        ...PERSON_SORT_FIELDS[params.sort],
      }),
    cacheName: PEOPLE_CACHE,
    cacheKey: `page:${params.page}:search:${params.search}:status:${effectiveStatus}:gender:${params.gender}:sort:${params.sort}`,
    ttlMs: 20_000,
  });

  const [searchInput, setSearchInput] = useState(params.search);
  const searchTimer = useRef<number | null>(null);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(
    () => () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    },
    [],
  );

  const navigate = (next: Partial<PeopleParams>) => {
    router.push(`/people${toQuery({ ...params, ...next })}`);
  };

  const rows = page?.data ?? [];

  const handleReactivate = async (event: FormEvent, person: PersonResponse) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await updatePersonStatus(api, person.id, "ACTIVE");
      cacheStore(PEOPLE_CACHE).invalidatePrefix("page");
      await reload();
      toast({
        kind: "success",
        title: t("people.toast.reactivated"),
        description: t("people.toast.reactivated.desc", {
          name: person.fullName,
        }),
      });
    } catch {
      setFeedback({
        kind: "error",
        message: t("people.toast.reactivateError"),
      });
    }
  };

  return (
    <section className="people-page" aria-labelledby="people-title">
      <div className="page-header w-full">
        <div className="flex flex-col">
          <h1 className="page-title" id="people-title">
            <span className="people-page__seed" aria-hidden="true" />
            {t("people.page.title")}
          </h1>
          <p className="page-description">
            {t("people.page.subtitle")}
          </p>
        </div>
        <Can capability="editPeople">
          <div className="flex flex-wrap gap-2">
            <Link className="button button--secondary" href="/people/import">
              <Upload aria-hidden="true" className="button__icon" />
              {t("people.import")}
            </Link>
            <Link className="button" href="/people/new">
              <UserRoundPlus aria-hidden="true" className="button__icon" />
              {t("people.new")}
            </Link>
          </div>
        </Can>
      </div>

      {feedback ? (
        <Alert
          variant={feedback.kind}
          title={
            feedback.kind === "success"
              ? t("people.alert.success")
              : t("people.alert.failure")
          }
        >
          {feedback.message}
        </Alert>
      ) : null}

      <div className="toolbar people-filters">
        <div className="people-filters__search">
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
            hint={t("people.search.hint")}
          />
        </div>
        <div className="people-filters__options">
          <SelectField
            label={t("common.status")}
            name="status"
            value={effectiveStatus}
            onChange={(event) =>
              navigate({
                status: event.target.value as PeopleParams["status"],
                page: 1,
              })
            }
            options={[
              { value: "", label: t("people.filter.all") },
              { value: "ACTIVE", label: t("people.filter.active") },
              ...(canListInactive
                ? [{ value: "INACTIVE", label: t("people.filter.inactive") }]
                : []),
            ]}
          />
          <SelectField
            label={t("people.field.gender")}
            name="gender"
            value={params.gender}
            onChange={(event) =>
              navigate({ gender: event.target.value, page: 1 })
            }
            options={[
              { value: "", label: t("people.filter.all") },
              { value: "Masculino", label: t("people.gender.male") },
              { value: "Feminino", label: t("people.gender.female") },
              { value: "Outro", label: t("people.gender.other") },
            ]}
          />
          <SelectField
            label={t("people.sort.label")}
            name="sort"
            value={params.sort}
            onChange={(event) =>
              navigate({
                sort: event.target.value as PeopleParams["sort"],
                page: 1,
              })
            }
            options={[
              { value: "fullName:asc", label: t("people.sort.nameAsc") },
              { value: "fullName:desc", label: t("people.sort.nameDesc") },
              { value: "birthDate:desc", label: t("people.sort.birthDateDesc") },
              { value: "birthDate:asc", label: t("people.sort.birthDateAsc") },
              { value: "createdAt:desc", label: t("people.sort.createdAtDesc") },
              { value: "createdAt:asc", label: t("people.sort.createdAtAsc") },
            ]}
          />
        </div>
        <Button
          className="people-filters__clear"
          variant="secondary"
          icon={FilterX}
          onClick={() => {
            setSearchInput("");
            navigate({
              search: "",
              status: "",
              gender: "",
              sort: DEFAULT_SORT,
              page: 1,
            });
          }}
        >
          {t("people.action.clearFilters")}
        </Button>
      </div>

      {error ? (
        <ErrorState
          title={t("people.error.list")}
          onRetry={() => void reload()}
        >
          {t("people.error.retry")}
        </ErrorState>
      ) : null}

      {loading && rows.length === 0 ? (
        <div aria-label={t("people.loading")}>
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
        </div>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <EmptyState title={t("people.emptyState.title")}>
          {t("people.emptyState.desc")}
        </EmptyState>
      ) : null}

      {rows.length > 0 ? (
        <>
          <Table<PersonResponse>
            className="people-table"
            rowKey={(person) => person.id}
            columns={[
              {
                key: "fullName",
                header: t("people.column.name"),
                mobileLabel: "",
                render: (person) =>
                  person.status === "ACTIVE" ? (
                    <Link className="people-name-link" href={`/people/${person.id}`}>
                      {person.fullName}
                    </Link>
                  ) : (
                    <span className="people-name-ink">{person.fullName}</span>
                  ),
              },
              {
                key: "email",
                header: t("people.column.email"),
                render: (person) => person.email ?? "—",
              },
              {
                key: "phone",
                header: t("people.column.phone"),
                render: (person) => formatPhone(person.phone),
              },
              {
                key: "birthDate",
                header: t("people.column.birthDate"),
                render: (person) =>
                  person.birthDate ? formatDateBR(person.birthDate) : "—",
              },
              {
                key: "gender",
                header: t("people.column.gender"),
                render: (person) => person.gender ?? "—",
              },
              {
                key: "status",
                header: t("common.status"),
                render: (person) => <StatusBadge status={person.status} />,
              },
              {
                key: "actions",
                header: t("common.actions"),
                className: "people-table__cell-actions",
                render: (person) =>
                  person.status === "INACTIVE" ? (
                    <Can capability="changePersonStatus">
                      <form
                        onSubmit={(event) =>
                          void handleReactivate(event, person)
                        }
                      >
                        <Button
                          type="submit"
                          variant="secondary"
                          className="button--sm"
                        >
                          {t("people.action.reactivate")}
                        </Button>
                      </form>
                    </Can>
                  ) : (
                    <span className="table__actions">
                      <Link
                        className="button button--secondary button--sm button--icon"
                        aria-label={t("people.action.viewDetails")}
                        href={`/people/${person.id}`}
                      >
                        <Eye aria-hidden="true" className="button__icon" />
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
