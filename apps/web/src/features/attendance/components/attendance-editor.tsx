"use client";

import Link from "next/link";
import { RefreshCw, Save, Trash2, Undo2, UserPlus } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { CreateMeetingVisitorRequest } from "@mission-atos/contracts";
import { ApiError } from "@/src/shared/api/api-error";
import { cacheStore } from "@/src/shared/cache/cache";
import { Alert, Button, Dialog, EmptyState, ErrorState, Skeleton } from "@/src/shared/components";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { toast } from "@/src/shared/toast/toast-store";
import { useSession } from "@/src/providers/session-provider";
import { useI18n } from "@/src/shared/i18n/language-provider";
import { listPeople } from "@/src/features/people/api/people-api";
import { addAttendanceVisitor, getAttendance, removeAttendanceVisitor, saveAttendance } from "../api/attendance-api";
import type { TranslationKey, TranslationParams } from "@/src/shared/i18n/dictionaries";

type Mark = "PRESENT" | "ABSENT" | "EXCUSED" | "UNMARKED";

function attendanceLabels(t: (key: TranslationKey, params?: TranslationParams) => string): Readonly<Record<Mark, string>> {
  return { PRESENT: t("attendance.present"), ABSENT: t("attendance.absent"), EXCUSED: t("attendance.excused"), UNMARKED: t("attendance.unmarked") };
}

export function AttendanceEditor() {
  const { api } = useSession();
  const { t, locale } = useI18n();
  const params = useParams<{ id: string; meetingId: string }>();
  const cellId = params.id;
  const meetingId = params.meetingId;
  const query = useRemoteQuery({ fetcher: () => getAttendance(api, cellId, meetingId), cacheName: "attendance", cacheKey: `${cellId}:${meetingId}`, ttlMs: 10_000 });
  const labels = attendanceLabels(t);
  const [marks, setMarks] = useState<Record<string, Mark> | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error" | "warning"; message: string } | null>(null);
  const [visitorOpen, setVisitorOpen] = useState(false);
  const [visitorKind, setVisitorKind] = useState<"quick-create" | "existing">("quick-create");
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [visitorPersonId, setVisitorPersonId] = useState("");
  const [invitedByPersonId, setInvitedByPersonId] = useState("");
  const [visitorObservation, setVisitorObservation] = useState("");
  const peopleQuery = useRemoteQuery({ fetcher: () => listPeople(api, { page: 1, pageSize: 100, status: "ACTIVE" }), cacheName: "people", cacheKey: "attendance-visitors", ttlMs: 20_000, enabled: visitorOpen });

  const baseline = useMemo(() => Object.fromEntries((query.data?.participants ?? []).map((person) => [person.personId, person.status])) as Record<string, Mark>, [query.data]);
  const effectiveMarks = marks ?? baseline;
  const dirty = useMemo(() => JSON.stringify(effectiveMarks) !== JSON.stringify(baseline), [effectiveMarks, baseline]);
  useEffect(() => {
    const listener = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", listener); return () => window.removeEventListener("beforeunload", listener);
  }, [dirty]);
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (dirty && anchor?.origin === window.location.origin && !window.confirm(t("attendance.skipChanges"))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", listener, true);
    return () => document.removeEventListener("click", listener, true);
  }, [dirty, t]);

  if (query.loading && !query.data) return <div aria-label={t("attendance.loading")}><Skeleton width="45%" height="2.5rem" /><Skeleton width="100%" height="18rem" /></div>;
  if (query.error && !query.data) {
    if (query.error instanceof ApiError && query.error.status === 403) return <ErrorState title={t("attendance.forbidden")}>{t("attendance.forbidden.desc")}</ErrorState>;
    if (query.error instanceof ApiError && query.error.status === 404) return <EmptyState title={t("attendance.notAvailable")}>{t("attendance.notAvailable.desc")}</EmptyState>;
    return <ErrorState title={t("attendance.unavailable")} onRetry={() => void query.reload()}>{t("attendance.unavailable.desc")}</ErrorState>;
  }
  if (!query.data) return <EmptyState title={t("attendance.notAvailable")}>{t("attendance.notAvailable.desc")}</EmptyState>;
  const snapshot = query.data;
  const filtered = snapshot.participants.filter((person) => person.fullName.toLocaleLowerCase(locale).includes(search.trim().toLocaleLowerCase(locale)));
  const counts = Object.values(effectiveMarks).reduce((acc, mark) => ({ ...acc, [mark]: acc[mark] + 1 }), { PRESENT: 0, ABSENT: 0, EXCUSED: 0, UNMARKED: 0 });

  const navigateStatuses = (event: ReactKeyboardEvent<HTMLButtonElement>, personId: string, currentStatus: Mark) => {
    const statuses = Object.keys(labels) as Mark[];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? statuses.length - 1
        : event.key === "ArrowRight" || event.key === "ArrowDown"
          ? (currentIndex + 1) % statuses.length
          : event.key === "ArrowLeft" || event.key === "ArrowUp"
            ? (currentIndex - 1 + statuses.length) % statuses.length
            : null;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextStatus = statuses[nextIndex];
    if (!nextStatus) return;
    setMarks({ ...effectiveMarks, [personId]: nextStatus });
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role='radio']");
    buttons?.[nextIndex]?.focus();
  };

  const save = async () => {
    setBusy(true); setFeedback(null); setConflict(false);
    try {
      const data = await saveAttendance(api, cellId, meetingId, { expectedRevision: snapshot.revision, attendance: Object.entries(effectiveMarks).filter(([, status]) => status !== "UNMARKED").map(([personId, status]) => ({ personId, status: status as Exclude<Mark, "UNMARKED"> })) });
      cacheStore("attendance").set(`${cellId}:${meetingId}`, data, 10_000);
      cacheStore("meetings").invalidatePrefix("detail");
      setMarks(null); await query.reload(); toast({ kind: "success", title: t("attendance.toast.savedTitle"), description: t("attendance.toast.saved.desc") });
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "ATTENDANCE_REVISION_CONFLICT") { setConflict(true); setFeedback({ kind: "warning", message: t("attendance.conflict.message") }); }
      else setFeedback({ kind: "error", message: t("attendance.error.save") });
    } finally { setBusy(false); }
  };

  const submitVisitor = async () => {
    const input: CreateMeetingVisitorRequest = visitorKind === "existing"
      ? { kind: "existing", personId: visitorPersonId, ...(invitedByPersonId ? { invitedByPersonId } : {}), ...(visitorObservation ? { observation: visitorObservation } : {}) }
      : { kind: "quick-create", name: visitorName, ...(visitorPhone ? { phone: visitorPhone } : {}), ...(invitedByPersonId ? { invitedByPersonId } : {}), ...(visitorObservation ? { observation: visitorObservation } : {}) };
    setBusy(true);
    try { await addAttendanceVisitor(api, cellId, meetingId, input); setVisitorOpen(false); setVisitorName(""); setVisitorPhone(""); setVisitorPersonId(""); setVisitorObservation(""); await query.reload(); }
    catch { setFeedback({ kind: "error", message: t("attendance.error.addVisitor") }); }
    finally { setBusy(false); }
  };

  return <section aria-labelledby="attendance-title" className="attendance-page">
    <header className="page-header"><h1 id="attendance-title" className="page-title">{t("attendance.pageTitle")}</h1><p className="page-description">{snapshot.meeting.cellName} · {snapshot.meeting.meetingDate}</p><Link href={`/cells/${cellId}/meetings/${meetingId}`}>{t("attendance.back")}</Link></header>
    {feedback ? <Alert variant={feedback.kind} title={t("attendance.alertTitle")}>{feedback.message}</Alert> : null}
    {conflict ? <div className="attendance-conflict"><Button variant="secondary" icon={RefreshCw} disabled={busy} onClick={() => void query.reload().then(() => { setConflict(false); setFeedback({ kind: "warning", message: t("attendance.conflict.updated") }); })}>{t("attendance.conflict.reload")}</Button></div> : null}
    {snapshot.isReadOnly ? <Alert variant="warning" title={t("attendance.readOnlyTitle")}>{t("attendance.readOnlyDesc")}</Alert> : null}
    <div className="attendance-summary" aria-label={t("attendance.detail.summary")}>
      <span><strong>{counts.PRESENT}</strong> {t("attendance.summary.present")}</span><span><strong>{counts.ABSENT}</strong> {t("attendance.summary.absent")}</span><span><strong>{counts.EXCUSED}</strong> {t("attendance.summary.excused")}</span><span><strong>{counts.UNMARKED}</strong> {t("attendance.summary.unmarked")}</span><span><strong>{snapshot.summary.visitorCount}</strong> {t("attendance.summary.visitors")}</span>
    </div>
    <div className="toolbar"><label className="field"><span className="field__label">{t("attendance.search")}</span><input className="input" type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></label>{snapshot.canEdit ? <Button icon={UserPlus} onClick={() => setVisitorOpen(true)}>{t("attendance.addVisitor")}</Button> : null}</div>
    {filtered.length === 0 ? <EmptyState title={search.trim() ? t("attendance.noParticipantFound") : t("attendance.noEligibleParticipants")}>{search.trim() ? t("attendance.noParticipantFound.desc") : t("attendance.noEligibleParticipants.desc")}</EmptyState> : <ul className="attendance-list">{filtered.map((person) => <li key={person.personId} className="attendance-person"><span className="attendance-person__name">{person.fullName}</span><div className="attendance-segments" role="radiogroup" aria-label={t("attendance.personFrequency", { name: person.fullName })}>{(Object.keys(labels) as Mark[]).map((status) => <button key={status} type="button" role="radio" aria-checked={effectiveMarks[person.personId] === status} tabIndex={effectiveMarks[person.personId] === status ? 0 : -1} className="attendance-segment" disabled={!snapshot.canEdit || busy} onClick={() => setMarks({ ...effectiveMarks, [person.personId]: status })} onKeyDown={(event) => navigateStatuses(event, person.personId, status)}>{labels[status]}</button>)}</div></li>)}</ul>}
    {snapshot.visitors.length ? <section><h2>{t("attendance.detail.visitors")}</h2><ul className="attendance-visitors">{snapshot.visitors.map((visitor) => <li key={visitor.personId}><span>{visitor.fullName}{visitor.contactPending ? ` · ${t("attendance.contactPending")}` : ""}</span>{snapshot.canEdit ? <Button variant="danger" size="sm" icon={Trash2} onClick={() => { if (window.confirm(t("attendance.removeVisitorConfirm"))) void removeAttendanceVisitor(api, cellId, meetingId, visitor.personId).then(() => query.reload()); }}>{t("attendance.removeVisitor")}</Button> : null}</li>)}</ul></section> : null}
    {snapshot.canEdit ? <div className="attendance-save"><Button icon={Save} disabled={!dirty || busy} loading={busy} loadingLabel={t("attendance.saving")} onClick={() => void save()}>{t("attendance.saveFrequency")}</Button><Button variant="secondary" icon={Undo2} disabled={!dirty || busy} onClick={() => setMarks(null)}>{t("attendance.discardChanges")}</Button>{dirty ? <span role="status">{t("attendance.unsaved")}</span> : null}</div> : null}
    <Dialog open={visitorOpen} onClose={() => setVisitorOpen(false)} title={t("attendance.visitor.dialogTitle")} description={t("attendance.visitor.dialogDescription")}><label className="field"><span className="field__label">{t("attendance.visitor.source")}</span><select className="select" value={visitorKind} onChange={(event) => setVisitorKind(event.target.value as "quick-create" | "existing")}><option value="quick-create">{t("attendance.visitor.sourceQuick")}</option><option value="existing">{t("attendance.visitor.sourceExisting")}</option></select></label>{visitorKind === "existing" ? <label className="field"><span className="field__label">{t("attendance.visitor.person")}</span><select className="select" value={visitorPersonId} onChange={(event) => setVisitorPersonId(event.target.value)}><option value="">{t("common.select")}</option>{peopleQuery.data?.data.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}</select></label> : <><label className="field"><span className="field__label">{t("attendance.visitor.name")}</span><input className="input" value={visitorName} onChange={(event) => setVisitorName(event.target.value)} required /></label><label className="field"><span className="field__label">{t("attendance.visitor.phoneOptional")}</span><input className="input" value={visitorPhone} onChange={(event) => setVisitorPhone(event.target.value)} /></label></>}<label className="field"><span className="field__label">{t("attendance.visitor.invitedBy")}</span><select className="select" value={invitedByPersonId} onChange={(event) => setInvitedByPersonId(event.target.value)}><option value="">{t("attendance.visitor.notInformed")}</option>{snapshot.participants.map((person) => <option key={person.personId} value={person.personId}>{person.fullName}</option>)}</select></label><label className="field"><span className="field__label">{t("attendance.visitor.observation")}</span><textarea className="textarea" maxLength={500} value={visitorObservation} onChange={(event) => setVisitorObservation(event.target.value)} /></label><div className="dialog-panel__actions"><Button variant="secondary" onClick={() => setVisitorOpen(false)}>{t("common.cancel")}</Button><Button disabled={busy || (visitorKind === "existing" ? !visitorPersonId : !visitorName.trim())} onClick={() => void submitVisitor()}>{t("attendance.visitor.add")}</Button></div></Dialog>
  </section>;
}
