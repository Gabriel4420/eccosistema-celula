"use client";

import Link from "next/link";
import { FilterX, Upload, UserRoundPlus } from "lucide-react";
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
import {
  listPeople,
  updatePersonStatus,
} from "@/src/features/people/api/people-api";

const PAGE_SIZE = 20;
const PEOPLE_CACHE = "people";

interface PeopleParams {
  readonly page: number;
  readonly search: string;
  readonly status: "ACTIVE" | "INACTIVE" | "";
  readonly gender: string;
}

function readParams(searchParams: URLSearchParams): PeopleParams {
  const status = searchParams.get("status");
  const requestedPage = Number(searchParams.get("page") ?? "1");
  return {
    page:
      Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    search: searchParams.get("search") ?? "",
    status: status === "ACTIVE" || status === "INACTIVE" ? status : "",
    gender: searchParams.get("gender") ?? "",
  };
}

function toQuery(params: PeopleParams): string {
  const next = new URLSearchParams();
  if (params.page > 1) next.set("page", String(params.page));
  if (params.search) next.set("search", params.search);
  if (params.status) next.set("status", params.status);
  if (params.gender) next.set("gender", params.gender);
  const value = next.toString();
  return value ? `?${value}` : "";
}

export function PeopleList() {
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
      }),
    cacheName: PEOPLE_CACHE,
    cacheKey: `page:${params.page}:search:${params.search}:status:${effectiveStatus}:gender:${params.gender}`,
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
        title: "Pessoa reativada",
        description: `${person.fullName} voltou a participar da igreja.`,
      });
    } catch {
      setFeedback({
        kind: "error",
        message: "Não foi possível reativar a pessoa. Tente novamente.",
      });
    }
  };

  return (
    <section aria-labelledby="people-title">
      <div className="page-header w-full">
        <div className="flex flex-col">
          <h1 className="page-title" id="people-title">
            Pessoas
          </h1>
          <p className="page-description">
            Mantenha o cadastro de pessoas da igreja.
          </p>
        </div>
        <Can capability="editPeople">
          <div className="flex flex-wrap gap-2">
            <Link className="button button--secondary" href="/people/import">
              <Upload aria-hidden="true" className="button__icon" />
              Importar pessoas
            </Link>
            <Link className="button" href="/people/new">
              <UserRoundPlus aria-hidden="true" className="button__icon" />
              Nova pessoa
            </Link>
          </div>
        </Can>
      </div>

      {feedback ? (
        <Alert
          variant={feedback.kind}
          title={feedback.kind === "success" ? "Sucesso" : "Falha"}
        >
          {feedback.message}
        </Alert>
      ) : null}

      <div className="toolbar">
        <TextField
          label="Buscar"
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
          hint="Nome, e-mail ou telefone"
        />
        <SelectField
          label="Status"
          name="status"
          value={effectiveStatus}
          onChange={(event) =>
            navigate({
              status: event.target.value as PeopleParams["status"],
              page: 1,
            })
          }
          options={[
            { value: "", label: "Todos" },
            { value: "ACTIVE", label: "Ativo" },
            ...(canListInactive
              ? [{ value: "INACTIVE", label: "Inativo" }]
              : []),
          ]}
        />
        <SelectField
          label="Gênero"
          name="gender"
          value={params.gender}
          onChange={(event) =>
            navigate({ gender: event.target.value, page: 1 })
          }
          options={[
            { value: "", label: "Todos" },
            { value: "M", label: "Masculino" },
            { value: "F", label: "Feminino" },
            { value: "O", label: "Outro" },
          ]}
        />
        <Button
          variant="secondary"
          icon={FilterX}
          onClick={() => {
            setSearchInput("");
            navigate({ search: "", status: "", gender: "", page: 1 });
          }}
        >
          Limpar filtros
        </Button>
      </div>

      {error ? (
        <ErrorState
          title="Não foi possível carregar as pessoas"
          onRetry={() => void reload()}
        >
          Tente novamente em instantes.
        </ErrorState>
      ) : null}

      {loading && rows.length === 0 ? (
        <div aria-label="Carregando pessoas">
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
        </div>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <EmptyState title="Nenhuma pessoa encontrada">
          Ajuste os filtros ou cadastre uma nova pessoa.
        </EmptyState>
      ) : null}

      {rows.length > 0 ? (
        <>
          <Table<PersonResponse>
            rowKey={(person) => person.id}
            columns={[
              {
                key: "fullName",
                header: "Nome",
                render: (person) =>
                  person.status === "ACTIVE" ? (
                    <Link href={`/people/${person.id}`}>{person.fullName}</Link>
                  ) : (
                    <span>{person.fullName}</span>
                  ),
              },
              {
                key: "email",
                header: "E-mail",
                render: (person) => person.email ?? "—",
              },
              {
                key: "phone",
                header: "Telefone",
                render: (person) => person.phone ?? "—",
              },
              {
                key: "birthDate",
                header: "Nascimento",
                render: (person) => person.birthDate ?? "—",
              },
              {
                key: "gender",
                header: "Gênero",
                render: (person) => person.gender ?? "—",
              },
              {
                key: "status",
                header: "Status",
                render: (person) => <StatusBadge status={person.status} />,
              },
              {
                key: "actions",
                header: "Ações",
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
                          Reativar
                        </Button>
                      </form>
                    </Can>
                  ) : (
                    <span className="table__actions">
                      <Link
                        className="button button--secondary button--sm"
                        href={`/people/${person.id}`}
                      >
                        Ver detalhes
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
