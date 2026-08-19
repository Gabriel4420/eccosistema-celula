"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { updateMeetingRequestSchema } from "@mission-atos/contracts";
import { Alert, Button, Dialog, EmptyState, ErrorState, Skeleton, TextField } from "@/src/shared/components";
import { ApiError } from "@/src/shared/api/api-error";
import { cacheStore } from "@/src/shared/cache/cache";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import {
  getMeeting,
  getMeetingReport,
  updateMeeting,
  updateMeetingStatus,
  upsertMeetingReport
} from "@/src/features/meetings/api/meetings-api";
import { formatMeetingDate, formatMeetingTimestamp } from "@/src/features/meetings/lib/format";
import { MeetingStatusBadge } from "./meeting-status-badge";

const MEETINGS_CACHE = "meetings";

type ConfirmAction = "none" | "complete" | "cancel";

export function MeetingDetail() {
  const { api } = useSession();
  const params = useParams<{ cellId: string; meetingId: string }>();
  const cellId = params.cellId;
  const meetingId = params.meetingId;

  const { data: meeting, loading, error, reload } = useRemoteQuery({
    fetcher: () => getMeeting(api, cellId, meetingId),
    cacheName: MEETINGS_CACHE,
    cacheKey: `detail:${cellId}:${meetingId}`,
    ttlMs: 20_000
  });

  const { data: reportData } = useRemoteQuery({
    fetcher: () => getMeetingReport(api, cellId, meetingId),
    cacheName: MEETINGS_CACHE,
    cacheKey: `report:${cellId}:${meetingId}`,
    ttlMs: 20_000
  });

  const [meetingDate, setMeetingDate] = useState("");
  const [observations, setObservations] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>("none");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  if (loading && !meeting) {
    return (
      <div aria-label="Carregando encontro">
        <Skeleton width="40%" height="2.5rem" />
        <Skeleton width="100%" height="8rem" />
      </div>
    );
  }

  if (error && !meeting) {
    return (
      <ErrorState title="Nao foi possivel carregar o encontro" onRetry={() => void reload()}>
        Tente novamente em instantes.
      </ErrorState>
    );
  }

  if (!meeting) {
    return <EmptyState title="Encontro nao encontrado">O encontro solicitado nao existe.</EmptyState>;
  }

  const isEditable = meeting.status === "SCHEDULED";
  const report = reportData?.data;
  const dirtyDate = meetingDate !== "" && meetingDate !== meeting.meetingDate;
  const dirtyObs = observations !== "" && observations !== (report?.observations ?? "");

  const handleSaveDate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setFieldErrors({});
    if (!dirtyDate) return;
    const parsed = updateMeetingRequestSchema.safeParse({ meetingDate });
    if (!parsed.success) {
      setFieldErrors({ meetingDate: "Data invalida." });
      return;
    }
    setBusy(true);
    try {
      await updateMeeting(api, cellId, meetingId, parsed.data);
      cacheStore(MEETINGS_CACHE).invalidatePrefix("detail");
      cacheStore(MEETINGS_CACHE).invalidatePrefix("page");
      await reload();
      setMeetingDate("");
      setFeedback({ kind: "success", message: "Data atualizada." });
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, "atualizar a data") });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveObservations = async () => {
    setFeedback(null);
    setBusy(true);
    try {
      await upsertMeetingReport(api, cellId, meetingId, {
        observations: observations.trim() || null
      });
      cacheStore(MEETINGS_CACHE).invalidatePrefix("report");
      await reload();
      setFeedback({ kind: "success", message: "Observacoes salvas." });
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, "salvar observacoes") });
    } finally {
      setBusy(false);
    }
  };

  const runComplete = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await updateMeetingStatus(api, cellId, meetingId, { status: "COMPLETED" });
      cacheStore(MEETINGS_CACHE).invalidatePrefix("detail");
      cacheStore(MEETINGS_CACHE).invalidatePrefix("page");
      await reload();
      setFeedback({ kind: "success", message: "Encontro concluido." });
      setConfirmAction("none");
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, "concluir o encontro") });
    } finally {
      setBusy(false);
    }
  };

  const runCancel = async () => {
    if (!cancellationReason.trim()) {
      setFeedback({ kind: "error", message: "Informe o motivo do cancelamento." });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await updateMeetingStatus(api, cellId, meetingId, {
        status: "CANCELED",
        cancellationReason: cancellationReason.trim()
      });
      cacheStore(MEETINGS_CACHE).invalidatePrefix("detail");
      cacheStore(MEETINGS_CACHE).invalidatePrefix("page");
      await reload();
      setFeedback({ kind: "success", message: "Encontro cancelado." });
      setConfirmAction("none");
      setCancellationReason("");
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, "cancelar o encontro") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="meeting-title">
      <div className="page-header">
        <h1 className="page-title" id="meeting-title">
          Encontro - {formatMeetingDate(meeting.meetingDate)}
        </h1>
        <Link className="breadcrumbs__link" href={`/cells/${cellId}/meetings`}>
          Voltar para encontros
        </Link>
      </div>

      {feedback ? (
        <Alert variant={feedback.kind} title={feedback.kind === "success" ? "Sucesso" : "Falha"}>
          {feedback.message}
        </Alert>
      ) : null}

      <div className="detail-list" style={{ marginBottom: "var(--space-5)" }}>
        <div className="detail-list__item">
          <span className="detail-list__label">Cedula</span>
          <span className="detail-list__value">{meeting.cell.name}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Data</span>
          <span className="detail-list__value">{formatMeetingDate(meeting.meetingDate)}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Status</span>
          <MeetingStatusBadge status={meeting.status} />
        </div>
        {meeting.cancellationReason ? (
          <div className="detail-list__item">
            <span className="detail-list__label">Motivo do cancelamento</span>
            <span className="detail-list__value">{meeting.cancellationReason}</span>
          </div>
        ) : null}
        <div className="detail-list__item">
          <span className="detail-list__label">Criado em</span>
          <span className="detail-list__value">{formatMeetingTimestamp(meeting.createdAt)}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Atualizado em</span>
          <span className="detail-list__value">{formatMeetingTimestamp(meeting.updatedAt)}</span>
        </div>
      </div>

      {isEditable ? (
        <form className="fieldset" onSubmit={(event) => void handleSaveDate(event)}>
          <fieldset className="fieldset">
            <legend className="fieldset__legend">Editar data</legend>
            <TextField
              label="Data"
              name="meetingDate"
              type="date"
              value={meetingDate === "" ? meeting.meetingDate : meetingDate}
              onChange={(event) => setMeetingDate(event.target.value)}
              error={fieldErrors.meetingDate}
              required
            />
            {fieldErrors.form ? <Alert variant="error">{fieldErrors.form}</Alert> : null}
            <Button type="submit" disabled={!dirtyDate} loading={busy} loadingLabel="Salvando...">
              Salvar data
            </Button>
          </fieldset>
        </form>
      ) : null}

      <div className="fieldset" style={{ marginTop: "var(--space-5)" }}>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">Observacoes</legend>
          <textarea
            className="textarea"
            value={observations === "" ? (report?.observations ?? "") : observations}
            onChange={(event) => setObservations(event.target.value)}
            rows={5}
            placeholder="Observacoes sobre o encontro..."
            disabled={!isEditable}
          />
          {isEditable ? (
            <Button
              onClick={() => void handleSaveObservations()}
              disabled={!dirtyObs}
              loading={busy}
              loadingLabel="Salvando..."
            >
              Salvar observacoes
            </Button>
          ) : null}
        </fieldset>
      </div>

      {isEditable ? (
        <div className="toolbar" style={{ marginTop: "var(--space-6)" }}>
          <Button variant="primary" onClick={() => setConfirmAction("complete")}>
            Concluir encontro
          </Button>
          <Button variant="danger" onClick={() => setConfirmAction("cancel")}>
            Cancelar encontro
          </Button>
        </div>
      ) : null}

      <Dialog
        open={confirmAction === "complete"}
        onClose={() => setConfirmAction("none")}
        title="Concluir encontro"
        description="O encontro sera marcado como concluido e nao podera ser editado."
      >
        <div className="dialog-panel__actions">
          <Button variant="secondary" onClick={() => setConfirmAction("none")} disabled={busy}>
            Cancelar
          </Button>
          <Button
            disabled={busy}
            loading={busy}
            loadingLabel="Confirmando..."
            onClick={() => void runComplete()}
          >
            Confirmar
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={confirmAction === "cancel"}
        onClose={() => setConfirmAction("none")}
        title="Cancelar encontro"
        description="Informe o motivo do cancelamento. O encontro sera cancelado permanentemente."
      >
        <textarea
          className="textarea"
          value={cancellationReason}
          onChange={(event) => setCancellationReason(event.target.value)}
          rows={3}
          placeholder="Motivo do cancelamento..."
        />
        <div className="dialog-panel__actions">
          <Button variant="secondary" onClick={() => setConfirmAction("none")} disabled={busy}>
            Voltar
          </Button>
          <Button
            variant="danger"
            disabled={busy || !cancellationReason.trim()}
            loading={busy}
            loadingLabel="Cancelando..."
            onClick={() => void runCancel()}
          >
            Confirmar cancelamento
          </Button>
        </div>
      </Dialog>
    </section>
  );
}

function messageForError(cause: unknown, action: string): string {
  if (!(cause instanceof ApiError)) {
    return `Nao foi possivel ${action}. Tente novamente.`;
  }
  switch (cause.code) {
    case "MEETING_NOT_EDITABLE":
      return "O encontro nao pode ser editado pois ja foi concluido ou cancelado.";
    case "MEETING_STATUS_TRANSITION_INVALID":
      return "A transicao de status nao e permitida neste momento.";
    case "MEETING_REPORT_NOT_EDITABLE":
      return "Nao e possivel editar observacoes de um encontro cancelado.";
    case "MEETING_DATE_CONFLICT":
      return "Ja existe um encontro agendado para esta data.";
    default:
      return `Nao foi possivel ${action}. O servidor pode ter recusado por seguranca.`;
  }
}
