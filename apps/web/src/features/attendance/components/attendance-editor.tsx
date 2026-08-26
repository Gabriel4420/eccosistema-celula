"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { CreateMeetingVisitorRequest } from "@mission-atos/contracts";
import { ApiError } from "@/src/shared/api/api-error";
import { cacheStore } from "@/src/shared/cache/cache";
import { Alert, Button, Dialog, EmptyState, ErrorState, Skeleton } from "@/src/shared/components";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { listPeople } from "@/src/features/people/api/people-api";
import { addAttendanceVisitor, getAttendance, removeAttendanceVisitor, saveAttendance } from "../api/attendance-api";

type Mark = "PRESENT" | "ABSENT" | "EXCUSED" | "UNMARKED";
const labels: Readonly<Record<Mark, string>> = { PRESENT: "Presente", ABSENT: "Ausente", EXCUSED: "Justificado", UNMARKED: "Limpar" };

export function AttendanceEditor() {
  const { api } = useSession();
  const params = useParams<{ id: string; meetingId: string }>();
  const cellId = params.id;
  const meetingId = params.meetingId;
  const query = useRemoteQuery({ fetcher: () => getAttendance(api, cellId, meetingId), cacheName: "attendance", cacheKey: `${cellId}:${meetingId}`, ttlMs: 10_000 });
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
      if (dirty && anchor?.origin === window.location.origin && !window.confirm("Descartar alterações não salvas?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", listener, true);
    return () => document.removeEventListener("click", listener, true);
  }, [dirty]);

  if (query.loading && !query.data) return <div aria-label="Carregando frequência"><Skeleton width="45%" height="2.5rem" /><Skeleton width="100%" height="18rem" /></div>;
  if (query.error && !query.data) {
    if (query.error instanceof ApiError && query.error.status === 403) return <ErrorState title="Acesso negado">Você não possui acesso à frequência deste encontro.</ErrorState>;
    if (query.error instanceof ApiError && query.error.status === 404) return <EmptyState title="Frequência ainda não disponível">Não há dados de frequência disponíveis para este encontro.</EmptyState>;
    return <ErrorState title="Frequência indisponível no momento" onRetry={() => void query.reload()}>Não foi possível consultar os dados deste encontro. Tente novamente em instantes.</ErrorState>;
  }
  if (!query.data) return <EmptyState title="Frequência ainda não disponível">Não há dados de frequência disponíveis para este encontro.</EmptyState>;
  const snapshot = query.data;
  const filtered = snapshot.participants.filter((person) => person.fullName.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")));
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
      setMarks(null); await query.reload(); setFeedback({ kind: "success", message: "Frequência salva." });
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "ATTENDANCE_REVISION_CONFLICT") { setConflict(true); setFeedback({ kind: "warning", message: "Outra pessoa alterou a frequência. Suas marcações foram preservadas; recarregue a base para comparar antes de salvar novamente." }); }
      else setFeedback({ kind: "error", message: "Não foi possível salvar. Suas alterações foram preservadas." });
    } finally { setBusy(false); }
  };

  const submitVisitor = async () => {
    const input: CreateMeetingVisitorRequest = visitorKind === "existing"
      ? { kind: "existing", personId: visitorPersonId, ...(invitedByPersonId ? { invitedByPersonId } : {}), ...(visitorObservation ? { observation: visitorObservation } : {}) }
      : { kind: "quick-create", name: visitorName, ...(visitorPhone ? { phone: visitorPhone } : {}), ...(invitedByPersonId ? { invitedByPersonId } : {}), ...(visitorObservation ? { observation: visitorObservation } : {}) };
    setBusy(true);
    try { await addAttendanceVisitor(api, cellId, meetingId, input); setVisitorOpen(false); setVisitorName(""); setVisitorPhone(""); setVisitorPersonId(""); setVisitorObservation(""); await query.reload(); }
    catch { setFeedback({ kind: "error", message: "Não foi possível adicionar o visitante." }); }
    finally { setBusy(false); }
  };

  return <section aria-labelledby="attendance-title" className="attendance-page">
    <header className="page-header"><h1 id="attendance-title" className="page-title">Frequência</h1><p className="page-description">{snapshot.meeting.cellName} · {snapshot.meeting.meetingDate}</p><Link href={`/cells/${cellId}/meetings/${meetingId}`}>Voltar ao encontro</Link></header>
    {feedback ? <Alert variant={feedback.kind} title="Frequência">{feedback.message}</Alert> : null}
    {conflict ? <div className="attendance-conflict"><Button variant="secondary" disabled={busy} onClick={() => void query.reload().then(() => { setConflict(false); setFeedback({ kind: "warning", message: "A base foi atualizada. Revise suas marcações preservadas antes de salvar." }); })}>Recarregar base para comparar</Button></div> : null}
    {snapshot.isReadOnly ? <Alert variant="warning" title="Somente leitura">Este encontro foi cancelado. O histórico foi preservado.</Alert> : null}
    <div className="attendance-summary" aria-label="Resumo da frequência">
      <span><strong>{counts.PRESENT}</strong> presentes</span><span><strong>{counts.ABSENT}</strong> ausentes</span><span><strong>{counts.EXCUSED}</strong> justificados</span><span><strong>{counts.UNMARKED}</strong> não marcados</span><span><strong>{snapshot.summary.visitorCount}</strong> visitantes</span>
    </div>
    <div className="toolbar"><label className="field"><span className="field__label">Buscar participante</span><input className="input" type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></label>{snapshot.canEdit ? <Button onClick={() => setVisitorOpen(true)}>Adicionar visitante</Button> : null}</div>
    {filtered.length === 0 ? <EmptyState title={search.trim() ? "Nenhum participante encontrado" : "Nenhum participante elegível"}>{search.trim() ? "Não encontramos participantes elegíveis com esse nome." : "Esta célula não possui participantes elegíveis na data do encontro."}</EmptyState> : <ul className="attendance-list">{filtered.map((person) => <li key={person.personId} className="attendance-person"><span className="attendance-person__name">{person.fullName}</span><div className="attendance-segments" role="radiogroup" aria-label={`Frequência de ${person.fullName}`}>{(Object.keys(labels) as Mark[]).map((status) => <button key={status} type="button" role="radio" aria-checked={effectiveMarks[person.personId] === status} tabIndex={effectiveMarks[person.personId] === status ? 0 : -1} className="attendance-segment" disabled={!snapshot.canEdit || busy} onClick={() => setMarks({ ...effectiveMarks, [person.personId]: status })} onKeyDown={(event) => navigateStatuses(event, person.personId, status)}>{labels[status]}</button>)}</div></li>)}</ul>}
    {snapshot.visitors.length ? <section><h2>Visitantes</h2><ul className="attendance-visitors">{snapshot.visitors.map((visitor) => <li key={visitor.personId}><span>{visitor.fullName}{visitor.contactPending ? " · contato pendente" : ""}</span>{snapshot.canEdit ? <Button variant="danger" size="sm" onClick={() => { if (window.confirm("Remover este visitante do encontro?")) void removeAttendanceVisitor(api, cellId, meetingId, visitor.personId).then(() => query.reload()); }}>Remover</Button> : null}</li>)}</ul></section> : null}
    {snapshot.canEdit ? <div className="attendance-save"><Button disabled={!dirty || busy} loading={busy} loadingLabel="Salvando..." onClick={() => void save()}>Salvar frequência</Button><Button variant="secondary" disabled={!dirty || busy} onClick={() => setMarks(null)}>Descartar alterações</Button>{dirty ? <span role="status">Alterações não salvas</span> : null}</div> : null}
    <Dialog open={visitorOpen} onClose={() => setVisitorOpen(false)} title="Adicionar visitante" description="Use uma pessoa existente ou faça um cadastro rápido."><label className="field"><span className="field__label">Origem</span><select className="select" value={visitorKind} onChange={(event) => setVisitorKind(event.target.value as "quick-create" | "existing")}><option value="quick-create">Cadastro rápido</option><option value="existing">Pessoa existente</option></select></label>{visitorKind === "existing" ? <label className="field"><span className="field__label">Pessoa</span><select className="select" value={visitorPersonId} onChange={(event) => setVisitorPersonId(event.target.value)}><option value="">Selecione</option>{peopleQuery.data?.data.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}</select></label> : <><label className="field"><span className="field__label">Nome</span><input className="input" value={visitorName} onChange={(event) => setVisitorName(event.target.value)} required /></label><label className="field"><span className="field__label">Telefone opcional</span><input className="input" value={visitorPhone} onChange={(event) => setVisitorPhone(event.target.value)} /></label></>}<label className="field"><span className="field__label">Convidado por</span><select className="select" value={invitedByPersonId} onChange={(event) => setInvitedByPersonId(event.target.value)}><option value="">Não informado</option>{snapshot.participants.map((person) => <option key={person.personId} value={person.personId}>{person.fullName}</option>)}</select></label><label className="field"><span className="field__label">Observação</span><textarea className="textarea" maxLength={500} value={visitorObservation} onChange={(event) => setVisitorObservation(event.target.value)} /></label><div className="dialog-panel__actions"><Button variant="secondary" onClick={() => setVisitorOpen(false)}>Cancelar</Button><Button disabled={busy || (visitorKind === "existing" ? !visitorPersonId : !visitorName.trim())} onClick={() => void submitVisitor()}>Adicionar</Button></div></Dialog>
  </section>;
}
