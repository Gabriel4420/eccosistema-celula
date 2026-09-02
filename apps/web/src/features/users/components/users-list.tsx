"use client";

import Link from "next/link";
import { FilterX, UserPlus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
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
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { getManagedRoles, listUsers } from "@/src/features/users/api/users-api";
import { UserDetailModal } from "@/src/features/users/components/user-detail-modal";
import { roleLabel } from "@/src/shared/auth/session";
import type { UserResponse } from "@mission-atos/contracts";

const PAGE_SIZE = 20;
const USERS_CACHE = "users";
const ROLES_CACHE = "managedRoles";

interface UsersParams {
  readonly page: number;
  readonly search: string;
  readonly status: "ACTIVE" | "BLOCKED" | "";
  readonly roleId: string;
}

function readParams(searchParams: URLSearchParams): UsersParams {
  const status = searchParams.get("status");
  const requestedPage = Number(searchParams.get("page") ?? "1");
  return {
    page:
      Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    search: searchParams.get("search") ?? "",
    status: status === "ACTIVE" || status === "BLOCKED" ? status : "",
    roleId: searchParams.get("roleId") ?? "",
  };
}

function toQuery(params: UsersParams): string {
  const next = new URLSearchParams();
  if (params.page > 1) next.set("page", String(params.page));
  if (params.search) next.set("search", params.search);
  if (params.status) next.set("status", params.status);
  if (params.roleId) next.set("roleId", params.roleId);
  const value = next.toString();
  return value ? `?${value}` : "";
}

export function UsersList() {
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
      listUsers(api, {
        page: params.page,
        pageSize: PAGE_SIZE,
        search: params.search || undefined,
        status: params.status || undefined,
        roleId: params.roleId || undefined,
      }),
    cacheName: USERS_CACHE,
    cacheKey: `page:${params.page}:search:${params.search}:status:${params.status}:roleId:${params.roleId}`,
    ttlMs: 20_000,
  });

  const { data: managedRoles } = useRemoteQuery({
    fetcher: () => getManagedRoles(api),
    cacheName: ROLES_CACHE,
    cacheKey: "catalog",
    ttlMs: 60_000,
  });

  const [searchInput, setSearchInput] = useState(params.search);
  const searchTimer = useRef<number | null>(null);
  const [detailUser, setDetailUser] = useState<UserResponse | null>(null);

  useEffect(
    () => () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    },
    [],
  );

  const navigate = (next: Partial<UsersParams>) => {
    router.push(`/users${toQuery({ ...params, ...next })}`);
  };

  const rows = page?.data ?? [];

  return (
    <section aria-labelledby="users-title">
      <div className="page-header w-full">
        <div className="flex flex-col gap-2">
          <h1 className="page-title" id="users-title">
            Usuários
          </h1>
          <p className="page-description">
            Gerencie contas, papéis e acesso dos usuários da sua igreja.
          </p>
        </div>
        <Link className="button h-8" href="/users/new">
          <UserPlus aria-hidden="true" className="button__icon" />
          Novo usuário
        </Link>
      </div>

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
          hint="Nome ou e-mail"
        />
        <SelectField
          label="Status"
          name="status"
          value={params.status}
          onChange={(event) =>
            navigate({
              status: event.target.value as UsersParams["status"],
              page: 1,
            })
          }
          options={[
            { value: "", label: "Todos" },
            { value: "ACTIVE", label: "Ativo" },
            { value: "BLOCKED", label: "Bloqueado" },
          ]}
        />
        <SelectField
          label="Papel"
          name="roleId"
          value={params.roleId}
          onChange={(event) =>
            navigate({ roleId: event.target.value, page: 1 })
          }
          options={[
            { value: "", label: "Todos" },
            ...(managedRoles ?? []).map((role) => ({
              value: role.id,
              label: roleLabel(role.name),
            })),
          ]}
        />
        <Button
          variant="secondary"
          icon={FilterX}
          onClick={() => {
            setSearchInput("");
            navigate({ search: "", status: "", roleId: "", page: 1 });
          }}
        >
          Limpar filtros
        </Button>
      </div>

      {error ? (
        <ErrorState
          title="Não foi possível carregar os usuários"
          onRetry={() => void reload()}
        >
          Tente novamente em instantes.
        </ErrorState>
      ) : null}

      {loading && rows.length === 0 ? (
        <div aria-label="Carregando usuários">
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
        </div>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <EmptyState title="Nenhum usuário encontrado">
          Ajuste os filtros ou cadastre um novo usuário.
        </EmptyState>
      ) : null}

      {rows.length > 0 ? (
        <>
          <Table<UserResponse>
            rowKey={(user) => user.id}
            columns={[
              {
                key: "name",
                header: "Nome",
                render: (user) => (
                  <Link href={`/users/${user.id}`}>
                    {user.firstName} {user.lastName}
                  </Link>
                ),
              },
              { key: "email", header: "E-mail", render: (user) => user.email },
              {
                key: "roles",
                header: "Papéis",
                render: (user) =>
                  user.roles.map((role) => roleLabel(role.name)).join(", "),
              },
              {
                key: "status",
                header: "Status",
                render: (user) => <StatusBadge status={user.status} />,
              },
              {
                key: "actions",
                header: "Ações",
                render: (user) => (
                  <span className="table__actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setDetailUser(user)}
                    >
                      Ver detalhes
                    </Button>
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

      {detailUser ? (
        <UserDetailModal
          user={detailUser}
          open
          onClose={() => setDetailUser(null)}
        />
      ) : null}
    </section>
  );
}
