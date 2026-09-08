"use client";

import Link from "next/link";
import { CalendarCheck, CalendarX2, Save } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { updateMeetingRequestSchema } from "@mission-atos/contracts";
import { Alert, Button, Dialog, EmptyState, ErrorState, Skeleton, TextField } from "@/src/shared/components";
import { ApiError } from "@/src/shared/api/api-error";
import { cacheStore } from "@/src/shared/cache/cache";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { toast } from "@/src/shared/toast/toast-store";
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { TranslationKey, TranslationParams } from "@/src/shared/i18n/dictionaries";
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
  const { t, locale } = useI18n();
  const { api } = useSession();
  const params = useParams<{ id: string; meetingId: string }>();
  const cellId = params.id;
  const meetingId = params.meetingId;

  const { data: meeting, loading, error, reload } = useRemoteQuery({
    fetcher: () => getMeeting(api, cellId, meetingId),
    cacheName: MEETINGS_CACHE,
    cacheKey: `detail:${cellId}:${meetingId}`,
    ttlMs: 20_000
  });

  const { data: reportData, reload: reloadReport } = useRemoteQuery({
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
      <div aria-label={t("meetings.detail.loading")}>
        <Skeleton width="40%" height="2.5rem" />
        <Skeleton width="100%" height="8rem" />
      </div>
    );
  }

  if (error && !meeting) {
    return (
      <ErrorState title={t("meetings.error.load")} onRetry={() => void reload()}>
        {t("meetings.error.retry")}
      </ErrorState>
    );
  }

  if (!meeting) {
    return <EmptyState title={t("meetings.detail.empty")}>{t("meetings.detail.empty.desc")}</EmptyState>;
  }

  const isEditable = meeting.status === "SCHEDULED";
  const canEditObs = meeting.status !== "CANCELED";
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
      setFieldErrors({ meetingDate: t("meetings.detail.dateError") });
      return;
    }
    setBusy(true);
    try {
      await updateMeeting(api, cellId, meetingId, parsed.data);
      cacheStore(MEETINGS_CACHE).invalidatePrefix("detail");
      cacheStore(MEETINGS_CACHE).invalidatePrefix("page");
      await reload();
      setMeetingDate("");
      toast({
        kind: "success",
        title: t("meetings.detail.toast.dateUpdated"),
        description: t("meetings.detail.toast.dateUpdated.desc")
      });
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, t("meetings.action.updateDate"), t) });
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
      await reloadReport();
      toast({
        kind: "success",
        title: t("meetings.detail.toast.observations"),
        description: t("meetings.detail.toast.observations.desc")
      });
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, t("meetings.action.saveObservations"), t) });
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
      toast({
        kind: "success",
        title: t("meetings.detail.toast.completed"),
        description: t("meetings.detail.toast.completed.desc")
      });
      setConfirmAction("none");
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, t("meetings.action.completeMeeting"), t) });
    } finally {
      setBusy(false);
    }
  };

  const runCancel = async () => {
    if (!cancellationReason.trim()) {
      setFeedback({ kind: "error", message: t("meetings.detail.error.reason") });
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
      toast({
        kind: "success",
        title: t("meetings.detail.toast.cancelled"),
        description: t("meetings.detail.toast.cancelled.desc")
      });
      setConfirmAction("none");
      setCancellationReason("");
    } catch (cause) {
      setFeedback({ kind: "error", message: messageForError(cause, t("meetings.action.cancelMeeting"), t) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="meeting-title">
      <div className="page-header">
        <h1 className="page-title" id="meeting-title">
          {t("meetings.detail.titleWithDate", { date: formatMeetingDate(meeting.meetingDate, locale) })}
        </h1>
        <Link className="breadcrumbs__link" href={`/cells/${cellId}/meetings`}>
          {t("meetings.detail.back")}
        </Link>
      </div>

      {feedback ? (
        <Alert variant={feedback.kind} title={feedback.kind === "success" ? t("common.success") : t("common.failure")}>
          {feedback.message}
        </Alert>
      ) : null}

      <div className="detail-list" style={{ marginBottom: "var(--space-5)" }}>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("meetings.detail.label.cell")}</span>
          <span className="detail-list__value">{meeting.cell.name}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("meetings.column.date")}</span>
          <span className="detail-list__value">{formatMeetingDate(meeting.meetingDate, locale)}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("common.status")}</span>
          <MeetingStatusBadge status={meeting.status} />
        </div>
        {meeting.cancellationReason ? (
          <div className="detail-list__item">
            <span className="detail-list__label">{t("meetings.detail.label.cancelReason")}</span>
            <span className="detail-list__value">{meeting.cancellationReason}</span>
          </div>
        ) : null}
        <div className="detail-list__item">
          <span className="detail-list__label">{t("meetings.detail.label.created")}</span>
          <span className="detail-list__value">{formatMeetingTimestamp(meeting.createdAt, locale)}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("meetings.detail.label.updated")}</span>
          <span className="detail-list__value">{formatMeetingTimestamp(meeting.updatedAt, locale)}</span>
        </div>
      </div>

      <div className="toolbar">
        <Link className="button" href={`/cells/${cellId}/meetings/${meetingId}/attendance`}>
          {t("meetings.detail.openAttendance")}
        </Link>
      </div>

      {isEditable ? (
        <form className="fieldset" onSubmit={(event) => void handleSaveDate(event)}>
          <fieldset className="fieldset">
            <legend className="fieldset__legend">{t("meetings.detail.editDate")}</legend>
            <TextField
              label={t("meetings.column.date")}
              name="meetingDate"
              type="date"
              value={meetingDate === "" ? meeting.meetingDate : meetingDate}
              onChange={(event) => setMeetingDate(event.target.value)}
              error={fieldErrors.meetingDate}
              required
            />
            {fieldErrors.form ? <Alert variant="error">{fieldErrors.form}</Alert> : null}
            <Button type="submit" icon={Save} disabled={!dirtyDate} loading={busy} loadingLabel={t("meetings.detail.saving")}>
              {t("meetings.detail.saveDate")}
            </Button>
          </fieldset>
        </form>
      ) : null}

      <div className="fieldset" style={{ marginTop: "var(--space-5)" }}>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">{t("meetings.detail.observations")}</legend>
          <textarea
            className="textarea"
            value={observations === "" ? (report?.observations ?? "") : observations}
            onChange={(event) => setObservations(event.target.value)}
            rows={5}
            placeholder={t("meetings.detail.observations.placeholder")}
            disabled={!canEditObs}
          />
          {canEditObs ? (
            <Button
              icon={Save}
              onClick={() => void handleSaveObservations()}
              disabled={!dirtyObs}
              loading={busy}
              loadingLabel={t("meetings.detail.saving")}
            >
              {t("meetings.detail.saveObservations")}
            </Button>
          ) : null}
        </fieldset>
      </div>

      {isEditable ? (
        <div className="toolbar" style={{ marginTop: "var(--space-6)" }}>
          <Button variant="primary" icon={CalendarCheck} onClick={() => setConfirmAction("complete")}>
            {t("meetings.detail.completeMeeting")}
          </Button>
          <Button variant="danger" icon={CalendarX2} onClick={() => setConfirmAction("cancel")}>
            {t("meetings.detail.cancelMeeting")}
          </Button>
        </div>
      ) : null}

      <Dialog
        open={confirmAction === "complete"}
        onClose={() => setConfirmAction("none")}
        title={t("meetings.detail.dialog.complete.title")}
        description={t("meetings.detail.dialog.complete.desc")}
      >
        <div className="dialog-panel__actions">
          <Button variant="secondary" onClick={() => setConfirmAction("none")} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={busy}
            loading={busy}
            loadingLabel={t("meetings.detail.dialog.confirming")}
            onClick={() => void runComplete()}
          >
            {t("common.confirm")}
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={confirmAction === "cancel"}
        onClose={() => setConfirmAction("none")}
        title={t("meetings.detail.dialog.cancel.title")}
        description={t("meetings.detail.dialog.cancel.desc")}
      >
        <textarea
          className="textarea"
          value={cancellationReason}
          onChange={(event) => setCancellationReason(event.target.value)}
          rows={3}
          placeholder={t("meetings.detail.dialog.cancel.placeholder")}
        />
        <div className="dialog-panel__actions">
          <Button variant="secondary" onClick={() => setConfirmAction("none")} disabled={busy}>
            {t("meetings.detail.dialog.cancel.back")}
          </Button>
          <Button
            variant="danger"
            disabled={busy || !cancellationReason.trim()}
            loading={busy}
            loadingLabel={t("meetings.detail.dialog.cancelling")}
            onClick={() => void runCancel()}
          >
            {t("meetings.detail.dialog.cancel.confirm")}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}

function messageForError(cause: unknown, action: string, t: (key: TranslationKey, params?: TranslationParams) => string): string {
  if (!(cause instanceof ApiError)) {
    return t("meetings.detail.error.tryAgain", { action });
  }
  switch (cause.code) {
    case "MEETING_NOT_EDITABLE":
      return t("meetings.detail.error.notEditable");
    case "MEETING_STATUS_TRANSITION_INVALID":
      return t("meetings.detail.error.transitionInvalid");
    case "MEETING_REPORT_NOT_EDITABLE":
      return t("meetings.detail.error.reportNotEditable");
    case "MEETING_DATE_CONFLICT":
      return t("meetings.detail.error.dateConflict");
    default:
      return t("meetings.detail.error.security", { action });
  }
}
