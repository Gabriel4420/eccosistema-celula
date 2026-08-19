"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { updateCellRequestSchema } from "@mission-atos/contracts";
import { Alert, Button, Dialog, EmptyState, ErrorState, SelectField, Skeleton, TextField } from "@/src/shared/components";
import { ApiError } from "@/src/shared/api/api-error";
import { cacheStore } from "@/src/shared/cache/cache";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import {
  getCell,
  updateCell,
  updateCellLeader,
  updateCellStatus,
  updateCellTraineeLeader
} from "@/src/features/cells/api/cells-api";
import type { CellMeetingDay } from "@/src/features/cells/api/cells-api";
import { formatCellDay, formatCellTimestamp } from "@/src/features/cells/lib/format";
import { AssignmentSelect } from "./assignment-select";
import { CellStatusBadge } from "./cell-status-badge";

const CELLS_CACHE = "cells";

const DAYS: ReadonlyArray<{ readonly value: string; readonly label: string }> = [
  { value: "MONDAY", label: "Segunda-feira" },
  { value: "TUESDAY", label: "Terça-feira" },
  { value: "WEDNESDAY", label: "Quarta-feira" },
  { value: "THURSDAY", label: "Quinta-feira" },
  { value: "FRIDAY", label: "Sexta-feira" },
  { value: "SATURDAY", label: "Sábado" },
  { value: "SUNDAY", label: "Domingo" }
];

type ConfirmAction = "none" | "status" | "leader" | "trainee" | "remove-trainee";

export function CellDetail() {
  const { api, capabilities, principal } = useSession();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: cell, loading, error, reload } = useRemoteQuery({
    fetcher: () => getCell(api, id),
    cacheName: CELLS_CACHE,
    cacheKey: `detail:${id}`,
    ttlMs: 20_000
  });

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [meetingDay, setMeetingDay] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [address, setAddress] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>("none");
  const [leaderDraft, setLeaderDraft] = useState<string | null>(null);
  const [supervisorDraft, setSupervisorDraft] = useState<string | null>(null);
  const [traineeDraft, setTraineeDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  if (loading && !cell) {
    return (
      <div aria-label="Carregando célula">
        <Skeleton width="40%" height="2.5rem" />
        <Skeleton width="100%" height="8rem" />
      </div>
    );
  }

  if (error && !cell) {
    return (
      <ErrorState title="Não foi possível carregar a célula" onRetry={() => void reload()}>
        Tente novamente em instantes.
      </ErrorState>
    );
  }

  if (!cell) {
    return <EmptyState title="Célula não encontrada">A célula solicitada não existe.</EmptyState>;
  }

  const me = principal?.userId;
  const canManage = capabilities.changeCellLeadership;
  const canEditGeneral = capabilities.editCellGeneralData;
  const canEditMeeting =
    capabilities.editCellSchedule &&
    (cell.leader?.id === me || cell.traineeLeader?.id === me || cell.supervisor?.id === me);

  const dirtyCode = code !== "" && code !== cell.code;
  const dirtyName = name !== "" && name !== cell.name;
  const dirtyDay = meetingDay !== "" && meetingDay !== cell.meetingDay;
  const dirtyTime = meetingTime !== "" && meetingTime !== cell.meetingTime;
  const dirtyAddress = address !== "" && address !== cell.address;
  const hasEdits = dirtyCode || dirtyName || dirtyDay || dirtyTime || dirtyAddress;

  const handleSaveEdits = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setFieldErrors({});
    const payload: Record<string, string> = {};
    if (dirtyCode) payload.code = code.trim();
    if (dirtyName) payload.name = name.trim();
    if (dirtyDay) payload.meetingDay = meetingDay;
    if (dirtyTime) payload.meetingTime = meetingTime.trim();
    if (dirtyAddress) payload.address = address.trim();
    if (Object.keys(payload).length === 0) return;
    const parsed = updateCellRequestSchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors({ form: "Verifique os dados alterados." });
      return;
    }
    setBusy(true);
    try {
      await updateCell(api, id, parsed.data);
      cacheStore(CELLS_CACHE).invalidatePrefix("detail");
      cacheStore(CELLS_CACHE).invalidatePrefix("page");
      await reload();
      setCode("");
      setName("");
      setMeetingDay("");
      setMeetingTime("");
      setAddress("");
      setFeedback({ kind: "success", message: "Célula atualizada." });
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, "salvar as alterações") });
    } finally {
      setBusy(false);
    }
  };

  const runStatusChange = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const next = cell.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      await updateCellStatus(api, id, next);
      cacheStore(CELLS_CACHE).invalidatePrefix("detail");
      cacheStore(CELLS_CACHE).invalidatePrefix("page");
      await reload();
      setFeedback({
        kind: "success",
        message: next === "ACTIVE" ? "Célula ativada." : "Célula suspensa."
      });
      setConfirmAction("none");
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, "alterar o status") });
    } finally {
      setBusy(false);
    }
  };

  const runLeaderChange = async () => {
    if (!leaderDraft || !supervisorDraft) {
      setFeedback({ kind: "error", message: "Selecione o líder e o supervisor." });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await updateCellLeader(api, id, { leaderId: leaderDraft, supervisorId: supervisorDraft });
      cacheStore(CELLS_CACHE).invalidatePrefix("detail");
      cacheStore(CELLS_CACHE).invalidatePrefix("page");
      await reload();
      setFeedback({ kind: "success", message: "Liderança atualizada." });
      setConfirmAction("none");
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, "alterar a liderança") });
    } finally {
      setBusy(false);
    }
  };

  const runTraineeChange = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await updateCellTraineeLeader(api, id, traineeDraft);
      cacheStore(CELLS_CACHE).invalidatePrefix("detail");
      cacheStore(CELLS_CACHE).invalidatePrefix("page");
      await reload();
      setFeedback({ kind: "success", message: "Líder em treinamento atualizado." });
      setConfirmAction("none");
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, "alterar o líder em treinamento") });
    } finally {
      setBusy(false);
    }
  };

  const statusTitle =
    cell.status === "ACTIVE"
      ? "Suspender célula"
      : cell.status === "FORMING"
        ? "Ativar célula"
        : "Reativar célula";
  const statusDescription =
    cell.status === "ACTIVE"
      ? "A célula ficará suspensa e continuará visível no histórico."
      : "A célula voltará ao status ativo. Células ativas exigem líder.";

  const openLeaderDialog = () => {
    setLeaderDraft(cell.leader?.id ?? null);
    setSupervisorDraft(cell.supervisor?.id ?? null);
    setConfirmAction("leader");
  };

  const openTraineeDialog = () => {
    setTraineeDraft(cell.traineeLeader?.id ?? null);
    setConfirmAction("trainee");
  };

  return (
    <section aria-labelledby="cell-title">
      <div className="page-header">
        <h1 className="page-title" id="cell-title">
          {cell.name}
        </h1>
        <Link className="breadcrumbs__link" href="/cells">
          Voltar para celulas
        </Link>
        <Link className="button button--secondary" href={`/cells/${id}/meetings`}>
          Ver encontros
        </Link>
      </div>

      {feedback ? (
        <Alert variant={feedback.kind} title={feedback.kind === "success" ? "Sucesso" : "Falha"}>
          {feedback.message}
        </Alert>
      ) : null}

      <div className="detail-list" style={{ marginBottom: "var(--space-5)" }}>
        <div className="detail-list__item">
          <span className="detail-list__label">Código</span>
          <span className="detail-list__value">{cell.code}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Status</span>
          <CellStatusBadge status={cell.status} />
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Líder</span>
          <span className="detail-list__value">{cell.leader?.name ?? "—"}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Supervisor</span>
          <span className="detail-list__value">{cell.supervisor?.name ?? "—"}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Líder em treinamento</span>
          <span className="detail-list__value">{cell.traineeLeader?.name ?? "—"}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Reunião</span>
          <span className="detail-list__value">
            {formatCellDay(cell.meetingDay)} às {cell.meetingTime}
          </span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Endereço</span>
          <span className="detail-list__value">{cell.address}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Criada em</span>
          <span className="detail-list__value">{formatCellTimestamp(cell.createdAt)}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Atualizada em</span>
          <span className="detail-list__value">{formatCellTimestamp(cell.updatedAt)}</span>
        </div>
      </div>

      {canEditGeneral || canEditMeeting ? (
        <form className="fieldset" onSubmit={(event) => void handleSaveEdits(event)}>
          <fieldset className="fieldset">
            <legend className="fieldset__legend">Editar dados</legend>
            {canEditGeneral ? (
              <>
                <TextField
                  label="Código"
                  name="code"
                  value={code === "" ? cell.code : code}
                  onChange={(event) => setCode(event.target.value)}
                  error={fieldErrors.code}
                  required
                />
                <TextField
                  label="Nome"
                  name="name"
                  value={name === "" ? cell.name : name}
                  onChange={(event) => setName(event.target.value)}
                  error={fieldErrors.name}
                  required
                />
              </>
            ) : null}
            {canEditMeeting ? (
              <>
                <SelectField
                  label="Dia da reunião"
                  name="meetingDay"
                  value={(meetingDay === "" ? cell.meetingDay : meetingDay) as CellMeetingDay}
                  onChange={(event) => setMeetingDay(event.target.value)}
                  error={fieldErrors.meetingDay}
                  options={DAYS}
                  required
                />
                <TextField
                  label="Horário"
                  name="meetingTime"
                  value={meetingTime === "" ? cell.meetingTime : meetingTime}
                  onChange={(event) => setMeetingTime(event.target.value)}
                  hint="Formato HH:mm, ex.: 19:30."
                  error={fieldErrors.meetingTime}
                  required
                />
                <TextField
                  label="Endereço"
                  name="address"
                  value={address === "" ? cell.address : address}
                  onChange={(event) => setAddress(event.target.value)}
                  error={fieldErrors.address}
                  required
                />
              </>
            ) : null}
            {fieldErrors.form ? <Alert variant="error">{fieldErrors.form}</Alert> : null}
            <Button type="submit" disabled={!hasEdits} loading={busy} loadingLabel="Salvando…">
              Salvar alterações
            </Button>
          </fieldset>
        </form>
      ) : null}

      {canManage ? (
        <div className="toolbar" style={{ marginTop: "var(--space-6)" }}>
          {cell.status === "ACTIVE" ? (
            <Button variant="danger" onClick={() => setConfirmAction("status")}>
              Suspender célula
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setConfirmAction("status")}>
              {cell.status === "FORMING" ? "Ativar célula" : "Reativar célula"}
            </Button>
          )}
          <Button variant="secondary" onClick={openLeaderDialog}>
            Alterar líder
          </Button>
          {cell.traineeLeader ? (
            <>
              <Button variant="secondary" onClick={openTraineeDialog}>
                Alterar líder em treinamento
              </Button>
              <Button variant="secondary" onClick={() => setConfirmAction("remove-trainee")}>
                Remover líder em treinamento
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={openTraineeDialog}>
              Atribuir líder em treinamento
            </Button>
          )}
        </div>
      ) : null}

      <Dialog
        open={confirmAction !== "none"}
        onClose={() => setConfirmAction("none")}
        title={statusTitle}
        description={statusDescription}
      >
        <div className="dialog-panel__actions">
          <Button variant="secondary" onClick={() => setConfirmAction("none")} disabled={busy}>
            Cancelar
          </Button>
          <Button
            variant={cell.status === "ACTIVE" ? "danger" : "primary"}
            disabled={busy}
            loading={busy}
            loadingLabel="Confirmando…"
            onClick={() => void runStatusChange()}
          >
            Confirmar
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={confirmAction === "leader"}
        onClose={() => setConfirmAction("none")}
        title="Alterar líder"
        description="O novo líder e o supervisor precisam estar ativos e na mesma igreja."
      >
        <AssignmentSelect
          label="Líder"
          kind="LEADER"
          value={leaderDraft}
          onChange={setLeaderDraft}
          currentLabel={cell.leader?.name}
          required
        />
        <AssignmentSelect
          label="Supervisor"
          kind="SUPERVISOR"
          value={supervisorDraft}
          onChange={setSupervisorDraft}
          currentLabel={cell.supervisor?.name}
          required
        />
        <div className="dialog-panel__actions">
          <Button variant="secondary" onClick={() => setConfirmAction("none")} disabled={busy}>
            Cancelar
          </Button>
          <Button
            disabled={busy || !leaderDraft || !supervisorDraft}
            loading={busy}
            loadingLabel="Confirmando…"
            onClick={() => void runLeaderChange()}
          >
            Confirmar
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={confirmAction === "trainee"}
        onClose={() => setConfirmAction("none")}
        title="Líder em treinamento"
        description="Selecione o usuário em treinamento ou limpe para remover."
      >
        <AssignmentSelect
          label="Líder em treinamento"
          kind="TRAINEE"
          value={traineeDraft}
          onChange={setTraineeDraft}
          currentLabel={cell.traineeLeader?.name}
        />
        <div className="dialog-panel__actions">
          <Button variant="secondary" onClick={() => setConfirmAction("none")} disabled={busy}>
            Cancelar
          </Button>
          <Button
            disabled={busy}
            loading={busy}
            loadingLabel="Confirmando…"
            onClick={() => void runTraineeChange()}
          >
            Confirmar
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={confirmAction === "remove-trainee"}
        onClose={() => setConfirmAction("none")}
        title="Remover líder em treinamento"
        description="O usuário deixará de ser líder em treinamento desta célula."
      >
        <div className="dialog-panel__actions">
          <Button variant="secondary" onClick={() => setConfirmAction("none")} disabled={busy}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            disabled={busy}
            loading={busy}
            loadingLabel="Confirmando…"
            onClick={() => {
              setTraineeDraft(null);
              void runTraineeChange();
            }}
          >
            Confirmar remoção
          </Button>
        </div>
      </Dialog>
    </section>
  );
}

function messageForError(cause: unknown, action: string): string {
  if (!(cause instanceof ApiError)) {
    return `Não foi possível ${action}. Tente novamente.`;
  }
  switch (cause.code) {
    case "CELL_CODE_CONFLICT":
      return "Já existe outra célula com este código.";
    case "CELL_LEADER_NOT_ELIGIBLE":
      return "O líder selecionado não está elegível.";
    case "CELL_SUPERVISOR_CONFLICT":
      return "O supervisor selecionado já supervisiona outro líder.";
    case "CELL_SUPERVISOR_NOT_FOUND":
    case "CELL_LEADERSHIP_CANDIDATE_NOT_FOUND":
      return "O candidato selecionado não está disponível.";
    case "CELL_STATUS_TRANSITION_INVALID":
      return "A transição de status não é permitida neste momento. Células ativas exigem líder.";
    default:
      return `Não foi possível ${action}. O servidor pode ter recusado por segurança.`;
  }
}
