"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, EmptyState, ErrorState, Pagination, SelectField, Skeleton, Table, TextField } from "@/src/shared/components";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
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
          Encontros
        </h1>
        <p className="page-description">
          Gerencie os encontros agendados da célula.
        </p>
        {capabilities.createMeetings ? (
          <Link className="button" href={`/cells/${cellId}/meetings/new`}>
            Novo encontro
          </Link>
        ) : null}
      </div>

      <div className="toolbar">
        <TextField
          label="Data início"
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
          hint="AAAA-MM-DD"
        />
        <TextField
          label="Data fim"
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
          hint="AAAA-MM-DD"
        />
        <SelectField
          label="Status"
          name="status"
          value={params.status}
          onChange={(event) => navigate({ status: event.target.value as MeetingsParams["status"], page: 1 })}
          options={[
            { value: "", label: "Todos" },
            { value: "SCHEDULED", label: "Agendado" },
            { value: "COMPLETED", label: "Concluído" },
            { value: "CANCELED", label: "Cancelado" }
          ]}
        />
        <Button
          variant="secondary"
          onClick={() => {
            setFromInput("");
            setToInput("");
            navigate({ from: "", to: "", status: "", page: 1 });
          }}
        >
          Limpar filtros
        </Button>
      </div>

      {error ? (
        <ErrorState title="Não foi possível carregar os encontros" onRetry={() => void reload()}>
          Tente novamente em instantes.
        </ErrorState>
      ) : null}

      {loading && rows.length === 0 ? (
        <div aria-label="Carregando encontros">
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
          <Skeleton width="100%" height="3rem" />
        </div>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <EmptyState title="Nenhum encontro encontrado">
          Ajuste os filtros ou agende um novo encontro.
        </EmptyState>
      ) : null}

      {rows.length > 0 ? (
        <>
          <Table<MeetingResponse>
            rowKey={(meeting) => meeting.id}
            columns={[
              {
                key: "meetingDate",
                header: "Data",
                render: (meeting) => formatMeetingDate(meeting.meetingDate)
              },
              {
                key: "status",
                header: "Status",
                render: (meeting) => <MeetingStatusBadge status={meeting.status} />
              },
              {
                key: "updatedAt",
                header: "Atualizado em",
                render: (meeting) => formatMeetingTimestamp(meeting.updatedAt)
              },
              {
                key: "actions",
                header: "Ações",
                render: (meeting) => (
                  <span className="table__actions">
                    <Link
                      className="button button--secondary button--sm"
                      href={`/cells/${cellId}/meetings/${meeting.id}`}
                    >
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
