"use client";

import Link from "next/link";
import { PauseCircle, Play, Save, Trash2, UserCog } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { updateCellRequestSchema } from "@mission-atos/contracts";
import { Alert, Button, Dialog, EmptyState, ErrorState, SelectField, Skeleton, TextField } from "@/src/shared/components";
import { ApiError } from "@/src/shared/api/api-error";
import { cacheStore } from "@/src/shared/cache/cache";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { toast } from "@/src/shared/toast/toast-store";
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { TranslationKey, TranslationParams } from "@/src/shared/i18n/dictionaries";
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

type ConfirmAction = "none" | "status" | "leader" | "trainee" | "remove-trainee";

export function CellDetail() {
  const { t, locale } = useI18n();
  const { api, capabilities, principal } = useSession();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const DAYS: ReadonlyArray<{ readonly value: string; readonly label: string }> = [
    { value: "MONDAY", label: t("cells.day.monday") },
    { value: "TUESDAY", label: t("cells.day.tuesday") },
    { value: "WEDNESDAY", label: t("cells.day.wednesday") },
    { value: "THURSDAY", label: t("cells.day.thursday") },
    { value: "FRIDAY", label: t("cells.day.friday") },
    { value: "SATURDAY", label: t("cells.day.saturday") },
    { value: "SUNDAY", label: t("cells.day.sunday") }
  ];

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
      <div aria-label={t("cells.detail.loading")}>
        <Skeleton width="40%" height="2.5rem" />
        <Skeleton width="100%" height="8rem" />
      </div>
    );
  }

  if (error && !cell) {
    return (
      <ErrorState title={t("cells.error.load")} onRetry={() => void reload()}>
        {t("cells.error.retry")}
      </ErrorState>
    );
  }

  if (!cell) {
    return <EmptyState title={t("cells.detail.empty")}>{t("cells.detail.empty.desc")}</EmptyState>;
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
      setFieldErrors({ form: t("cells.detail.error.form") });
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
      toast({
        kind: "success",
        title: t("cells.detail.toast.updated"),
        description: t("cells.detail.toast.saved.desc")
      });
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, t("cells.action.saveChanges"), t) });
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
      toast({
        kind: "success",
        title: next === "ACTIVE" ? t("cells.detail.toast.activated") : t("cells.detail.toast.suspended"),
        description: next === "ACTIVE" ? t("cells.detail.toast.activated.desc") : t("cells.detail.toast.suspended.desc")
      });
      setConfirmAction("none");
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, t("cells.action.changeStatus"), t) });
    } finally {
      setBusy(false);
    }
  };

  const runLeaderChange = async () => {
    if (!leaderDraft || !supervisorDraft) {
      setFeedback({ kind: "error", message: t("cells.detail.error.leaderRequired") });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await updateCellLeader(api, id, { leaderId: leaderDraft, supervisorId: supervisorDraft });
      cacheStore(CELLS_CACHE).invalidatePrefix("detail");
      cacheStore(CELLS_CACHE).invalidatePrefix("page");
      await reload();
      toast({
        kind: "success",
        title: t("cells.detail.toast.leadership"),
        description: t("cells.detail.toast.leadership.desc")
      });
      setConfirmAction("none");
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, t("cells.action.changeLeadership"), t) });
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
      toast({
        kind: "success",
        title: t("cells.detail.toast.trainee"),
        description: t("cells.detail.toast.trainee.desc")
      });
      setConfirmAction("none");
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, t("cells.action.changeTrainee"), t) });
    } finally {
      setBusy(false);
    }
  };

  const statusTitle =
    cell.status === "ACTIVE"
      ? t("cells.detail.status.suspend")
      : cell.status === "FORMING"
        ? t("cells.detail.status.activate")
        : t("cells.detail.status.reactivate");
  const statusDescription =
    cell.status === "ACTIVE"
      ? t("cells.detail.status.suspend.desc")
      : t("cells.detail.status.activate.desc");

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
          {t("cells.detail.back")}
        </Link>
        <Link className="button button--secondary" href={`/cells/${id}/meetings`}>
          {t("cells.detail.viewMeetings")}
        </Link>
      </div>

      {feedback ? (
        <Alert variant={feedback.kind} title={feedback.kind === "success" ? t("common.success") : t("common.failure")}>
          {feedback.message}
        </Alert>
      ) : null}

      <div className="detail-list" style={{ marginBottom: "var(--space-5)" }}>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("cells.column.code")}</span>
          <span className="detail-list__value">{cell.code}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("common.status")}</span>
          <CellStatusBadge status={cell.status} />
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("cells.column.leader")}</span>
          <span className="detail-list__value">{cell.leader?.name ?? "—"}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("cells.detail.label.supervisor")}</span>
          <span className="detail-list__value">{cell.supervisor?.name ?? "—"}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("cells.detail.label.trainee")}</span>
          <span className="detail-list__value">{cell.traineeLeader?.name ?? "—"}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("cells.detail.label.meeting")}</span>
          <span className="detail-list__value">
            {t("cells.detail.meetingAt", { day: formatCellDay(cell.meetingDay, t), time: cell.meetingTime })}
          </span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("cells.detail.label.address")}</span>
          <span className="detail-list__value">{cell.address}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("cells.detail.label.created")}</span>
          <span className="detail-list__value">{formatCellTimestamp(cell.createdAt, locale)}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("cells.detail.label.updated")}</span>
          <span className="detail-list__value">{formatCellTimestamp(cell.updatedAt, locale)}</span>
        </div>
      </div>

      {canEditGeneral || canEditMeeting ? (
        <form className="fieldset" onSubmit={(event) => void handleSaveEdits(event)}>
          <fieldset className="fieldset">
            <legend className="fieldset__legend">{t("cells.detail.edit")}</legend>
            {canEditGeneral ? (
              <>
                <TextField
                  label={t("cells.column.code")}
                  name="code"
                  value={code === "" ? cell.code : code}
                  onChange={(event) => setCode(event.target.value)}
                  error={fieldErrors.code}
                  required
                />
                <TextField
                  label={t("cells.detail.field.name")}
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
                  label={t("cells.detail.field.meetingDay")}
                  name="meetingDay"
                  value={(meetingDay === "" ? cell.meetingDay : meetingDay) as CellMeetingDay}
                  onChange={(event) => setMeetingDay(event.target.value)}
                  error={fieldErrors.meetingDay}
                  options={DAYS}
                  required
                />
                <TextField
                  label={t("cells.detail.field.time")}
                  name="meetingTime"
                  value={meetingTime === "" ? cell.meetingTime : meetingTime}
                  onChange={(event) => setMeetingTime(event.target.value)}
                  hint={t("cells.detail.time.hint")}
                  error={fieldErrors.meetingTime}
                  required
                />
                <TextField
                  label={t("cells.detail.field.address")}
                  name="address"
                  value={address === "" ? cell.address : address}
                  onChange={(event) => setAddress(event.target.value)}
                  error={fieldErrors.address}
                  required
                />
              </>
            ) : null}
            {fieldErrors.form ? <Alert variant="error">{fieldErrors.form}</Alert> : null}
            <Button type="submit" icon={Save} disabled={!hasEdits} loading={busy} loadingLabel={t("common.saving")}>
              {t("cells.detail.saveChanges")}
            </Button>
          </fieldset>
        </form>
      ) : null}

      {canManage ? (
        <div className="toolbar" style={{ marginTop: "var(--space-6)" }}>
          {cell.status === "ACTIVE" ? (
            <Button variant="danger" icon={PauseCircle} onClick={() => setConfirmAction("status")}>
              {t("cells.detail.status.suspend")}
            </Button>
          ) : (
            <Button variant="secondary" icon={Play} onClick={() => setConfirmAction("status")}>
              {cell.status === "FORMING" ? t("cells.detail.status.activate") : t("cells.detail.status.reactivate")}
            </Button>
          )}
          <Button variant="secondary" icon={UserCog} onClick={openLeaderDialog}>
            {t("cells.detail.changeLeader")}
          </Button>
          {cell.traineeLeader ? (
            <>
              <Button variant="secondary" icon={UserCog} onClick={openTraineeDialog}>
                {t("cells.detail.changeTrainee")}
              </Button>
              <Button variant="secondary" icon={Trash2} onClick={() => setConfirmAction("remove-trainee")}>
                {t("cells.detail.removeTrainee")}
              </Button>
            </>
          ) : (
            <Button variant="secondary" icon={UserCog} onClick={openTraineeDialog}>
              {t("cells.detail.assignTrainee")}
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
            {t("common.cancel")}
          </Button>
          <Button
            variant={cell.status === "ACTIVE" ? "danger" : "primary"}
            disabled={busy}
            loading={busy}
            loadingLabel={t("cells.detail.dialog.confirming")}
            onClick={() => void runStatusChange()}
          >
            {t("cells.detail.dialog.confirm")}
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={confirmAction === "leader"}
        onClose={() => setConfirmAction("none")}
        title={t("cells.detail.dialog.changeLeader.title")}
        description={t("cells.detail.dialog.changeLeader.desc")}
      >
        <AssignmentSelect
          label={t("cells.column.leader")}
          kind="LEADER"
          value={leaderDraft}
          onChange={setLeaderDraft}
          currentLabel={cell.leader?.name}
          required
        />
        <AssignmentSelect
          label={t("cells.detail.label.supervisor")}
          kind="SUPERVISOR"
          value={supervisorDraft}
          onChange={setSupervisorDraft}
          currentLabel={cell.supervisor?.name}
          required
        />
        <div className="dialog-panel__actions">
          <Button variant="secondary" onClick={() => setConfirmAction("none")} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={busy || !leaderDraft || !supervisorDraft}
            loading={busy}
            loadingLabel={t("cells.detail.dialog.confirming")}
            onClick={() => void runLeaderChange()}
          >
            {t("cells.detail.dialog.confirm")}
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={confirmAction === "trainee"}
        onClose={() => setConfirmAction("none")}
        title={t("cells.detail.dialog.trainee.title")}
        description={t("cells.detail.dialog.trainee.desc")}
      >
        <AssignmentSelect
          label={t("cells.detail.label.trainee")}
          kind="TRAINEE"
          value={traineeDraft}
          onChange={setTraineeDraft}
          currentLabel={cell.traineeLeader?.name}
        />
        <div className="dialog-panel__actions">
          <Button variant="secondary" onClick={() => setConfirmAction("none")} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={busy}
            loading={busy}
            loadingLabel={t("cells.detail.dialog.confirming")}
            onClick={() => void runTraineeChange()}
          >
            {t("cells.detail.dialog.confirm")}
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={confirmAction === "remove-trainee"}
        onClose={() => setConfirmAction("none")}
        title={t("cells.detail.dialog.removeTrainee.title")}
        description={t("cells.detail.dialog.removeTrainee.desc")}
      >
        <div className="dialog-panel__actions">
          <Button variant="secondary" onClick={() => setConfirmAction("none")} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="danger"
            disabled={busy}
            loading={busy}
            loadingLabel={t("cells.detail.dialog.confirming")}
            onClick={() => {
              setTraineeDraft(null);
              void runTraineeChange();
            }}
          >
            {t("cells.detail.dialog.removeTrainee.confirm")}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}

function messageForError(cause: unknown, action: string, t: (key: TranslationKey, params?: TranslationParams) => string): string {
  if (!(cause instanceof ApiError)) {
    return t("cells.detail.error.tryAgain", { action });
  }
  switch (cause.code) {
    case "CELL_CODE_CONFLICT":
      return t("cells.detail.error.codeConflict");
    case "CELL_LEADER_NOT_ELIGIBLE":
      return t("cells.detail.error.leaderNotEligible");
    case "CELL_SUPERVISOR_CONFLICT":
      return t("cells.detail.error.supervisorConflict");
    case "CELL_SUPERVISOR_NOT_FOUND":
    case "CELL_LEADERSHIP_CANDIDATE_NOT_FOUND":
      return t("cells.detail.error.candidateNotFound");
    case "CELL_STATUS_TRANSITION_INVALID":
      return t("cells.detail.error.transitionInvalid");
    default:
      return t("cells.detail.error.generic", { action });
  }
}
