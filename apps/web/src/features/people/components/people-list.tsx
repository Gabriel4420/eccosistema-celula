"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import type { PersonResponse } from "@mission-atos/contracts";
import { Alert, Button, EmptyState, ErrorState, Pagination, SelectField, Skeleton, StatusBadge, Table, TextField } from "@/src/shared/components";
import { Can } from "@/src/shared/auth/guards";
import { cacheStore } from "@/src/shared/cache/cache";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { listPeople, updatePersonStatus } from "@/src/features/people/api/people-api";

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
  return {
    page: Number(searchParams.get("page") ?? "1") || 1,
    search: searchParams.get("search") ?? "",
    status: status === "ACTIVE" || status === "INACTIVE" ? status : "",
    gender: searchParams.get("gender") ?? ""
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
  const effectiveStatus = !canListInactive && params.status === "INACTIVE" ? "" : params.status;

  const { data: page, loading, error, reload } = useRemoteQuery({
    fetcher: () => listPeople(api, { page: params.page, pageSize: PAGE_SIZE, search: params.search || undefined, status: effectiveStatus || undefined, gender: params.gender || undefined }),
    cacheName: PEOPLE_CACHE,
    cacheKey: `page:${params.page}:search:${params.search}:status:${effectiveStatus}:gender:${params.gender}`,
    ttlMs: 20_000
  });

  const [searchInput, setSearchInput] = useState(params.search);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

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
      setFeedback({ kind: "success", message: `${person.fullName} foi reativado(a).` });
    } catch {
      setFeedback({ kind: "error", message: "Não foi possível reativar a pessoa. Tente novamente." });
    }
  };

  return (
    <section aria-labelledby="people-title">
      <div className="page-header">
        <h1 className="page-title" id="people-title">
          Pessoas
        </h1>
        <p className="page-description">
          Mantenha o cadastro de pessoas da igreja.
        </p>
        <Can capability="editPeople">
          <Link className="button" href="/people/new">
            Nova pessoa
          </Link>
        </Can>
      </div>

      {feedback ? (
        <Alert variant={feedback.kind} title={feedback.kind === "success" ? "Sucesso" : "Falha"}>
          {feedback.message}
        </Alert>
      ) : null}

      <div className="toolbar">
        <TextField
          label="Buscar"
          name="search"
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
            window.setTimeout(() => {
              navigate({ search: event.target.value, page: 1 });
            }, 300);
          }}
          hint="Nome, e-mail ou telefone"
        />
        <SelectField
          label="Status"
          name="status"
          value={effectiveStatus}
          onChange={(event) => navigate({ status: event.target.value as PeopleParams["status"], page: 1 })}
          options={[
            { value: "", label: "Todos" },
            { value: "ACTIVE", label: "Ativo" },
            ...(canListInactive ? [{ value: "INACTIVE", label: "Inativo" }] : [])
          ]}
        />
        <SelectField
          label="Gênero"
          name="gender"
          value={params.gender}
          onChange={(event) => navigate({ gender: event.target.value, page: 1 })}
          options={[
            { value: "", label: "Todos" },
            { value: "M", label: "Masculino" },
            { value: "F", label: "Feminino" },
            { value: "O", label: "Outro" }
          ]}
        />
        <Button
          variant="secondary"
          onClick={() => {
            setSearchInput("");
            navigate({ search: "", status: "", gender: "", page: 1 });
          }}
        >
          Limpar filtros
        </Button>
      </div>

      {error ? (
        <ErrorState title="Não foi possível carregar as pessoas" onRetry={() => void reload()}>
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
                  )
              },
              { key: "email", header: "E-mail", render: (person) => person.email ?? "—" },
              { key: "phone", header: "Telefone", render: (person) => person.phone ?? "—" },
              { key: "birthDate", header: "Nascimento", render: (person) => person.birthDate ?? "—" },
              { key: "gender", header: "Gênero", render: (person) => person.gender ?? "—" },
              { key: "status", header: "Status", render: (person) => <StatusBadge status={person.status} /> },
              {
                key: "actions",
                header: "Ações",
                render: (person) =>
                  person.status === "INACTIVE" ? (
                    <Can capability="changePersonStatus">
                      <form onSubmit={(event) => void handleReactivate(event, person)}>
                        <Button type="submit" variant="secondary" className="button--sm">
                          Reativar
                        </Button>
                      </form>
                    </Can>
                  ) : (
                    <span className="table__actions">
                      <Link className="button button--secondary button--sm" href={`/people/${person.id}`}>
                        Ver detalhes
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
