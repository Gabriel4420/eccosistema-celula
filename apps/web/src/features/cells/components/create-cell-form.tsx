"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { createCellRequestSchema } from "@mission-atos/contracts";
import type { z } from "zod";
import { Alert, Button, SelectField, TextField } from "@/src/shared/components";
import { ApiError } from "@/src/shared/api/api-error";
import { cacheStore } from "@/src/shared/cache/cache";
import { useSession } from "@/src/providers/session-provider";
import { toast } from "@/src/shared/toast/toast-store";
import { createCell } from "@/src/features/cells/api/cells-api";
import { AssignmentSelect } from "./assignment-select";

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

type CreateStatus = "FORMING" | "ACTIVE" | "SUSPENDED";

function errorsFromIssue(issues: readonly z.ZodIssue[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] = issue.message;
  }
  return errors;
}

export function CreateCellForm() {
  const { api } = useSession();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<CreateStatus>("FORMING");
  const [leaderId, setLeaderId] = useState<string | null>(null);
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  const [traineeLeaderId, setTraineeLeaderId] = useState<string | null>(null);
  const [meetingDay, setMeetingDay] = useState("MONDAY");
  const [meetingTime, setMeetingTime] = useState("19:30");
  const [address, setAddress] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  const lastPayload = useRef<string | null>(null);

  const leaderRequired = status === "ACTIVE";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const input = {
      code,
      name,
      status,
      leaderId,
      supervisorId,
      traineeLeaderId,
      meetingDay,
      meetingTime,
      address
    };

    const parsed = createCellRequestSchema.safeParse(input);
    if (!parsed.success) {
      setFieldErrors(errorsFromIssue(parsed.error.issues));
      return;
    }

    const serialized = JSON.stringify(parsed.data);
    if (lastPayload.current !== serialized || !idempotencyKey.current) {
      lastPayload.current = serialized;
      idempotencyKey.current = crypto.randomUUID();
    }

    setSubmitting(true);
    try {
      const cell = await createCell(api, parsed.data, idempotencyKey.current);
      cacheStore(CELLS_CACHE).invalidatePrefix("page");
      toast({
        kind: "success",
        title: "Célula criada",
        description: cell.name
      });
      router.push(`/cells/${cell.id}`);
    } catch (cause) {
      const message = messageForError(cause);
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="new-cell-title">
      <div className="page-header">
        <h1 className="page-title" id="new-cell-title">
          Nova célula
        </h1>
        <Link className="breadcrumbs__link" href="/cells">
          Voltar para células
        </Link>
      </div>

      {formError ? (
        <Alert variant="error" title="Não foi possível criar">
          {formError}
        </Alert>
      ) : null}

      <form className="fieldset" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">Identificação</legend>
          <TextField
            label="Código"
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            hint="Ex.: CEL-001. Letras maiúsculas e hífens."
            error={fieldErrors.code}
            required
          />
          <TextField
            label="Nome"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            hint="Ex.: Célula Esperança."
            error={fieldErrors.name}
            required
          />
          <SelectField
            label="Status"
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as CreateStatus)}
            error={fieldErrors.status}
            options={[
              { value: "FORMING", label: "Em formação" },
              { value: "ACTIVE", label: "Ativa" },
              { value: "SUSPENDED", label: "Suspensa" }
            ]}
            hint="Ativa exige líder e supervisor elegíveis."
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset__legend">Liderança</legend>
          <AssignmentSelect
            label="Líder"
            kind="LEADER"
            value={leaderId}
            onChange={setLeaderId}
            error={fieldErrors.leaderId}
            required={leaderRequired}
            hint="Busque pelo nome do usuário."
          />
          <AssignmentSelect
            label="Supervisor"
            kind="SUPERVISOR"
            value={supervisorId}
            onChange={setSupervisorId}
            error={fieldErrors.supervisorId}
            required={leaderRequired}
            hint="Busque pelo nome do usuário."
          />
          <AssignmentSelect
            label="Líder em treinamento"
            kind="TRAINEE"
            value={traineeLeaderId}
            onChange={setTraineeLeaderId}
            error={fieldErrors.traineeLeaderId}
            hint="Opcional. Busque pelo nome do usuário."
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset__legend">Reunião e local</legend>
          <SelectField
            label="Dia da reunião"
            name="meetingDay"
            value={meetingDay}
            onChange={(event) => setMeetingDay(event.target.value)}
            error={fieldErrors.meetingDay}
            options={DAYS}
            required
          />
          <TextField
            label="Horário"
            name="meetingTime"
            value={meetingTime}
            onChange={(event) => setMeetingTime(event.target.value)}
            hint="Formato HH:mm, ex.: 19:30."
            error={fieldErrors.meetingTime}
            required
          />
          <TextField
            label="Endereço"
            name="address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            hint="Local onde a célula se reúne."
            error={fieldErrors.address}
            required
          />
        </fieldset>

        <div className="dialog-panel__actions" style={{ justifyContent: "flex-start", marginTop: "var(--space-4)" }}>
          <Button type="submit" icon={Plus} loading={submitting} loadingLabel="Criando…">
            Criar célula
          </Button>
          <Link className="button button--secondary" href="/cells">
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}

function messageForError(cause: unknown): string {
  if (!(cause instanceof ApiError)) {
    return "Não foi possível criar a célula. Verifique os dados e tente novamente.";
  }
  switch (cause.code) {
    case "CELL_CODE_CONFLICT":
      return "Já existe uma célula com este código.";
    case "CELL_LEADER_NOT_ELIGIBLE":
      return "O líder selecionado não está elegível para liderar a célula.";
    case "CELL_SUPERVISOR_CONFLICT":
      return "O supervisor selecionado já supervisiona outro líder.";
    case "CELL_LEADERSHIP_CANDIDATE_NOT_FOUND":
    case "CELL_SUPERVISOR_NOT_FOUND":
      return "O líder ou supervisor selecionado não está disponível.";
    case "IDEMPOTENCY_KEY_CONFLICT":
      return "A tentativa anterior conflitou com outra. Tente novamente.";
    default:
      return "Não foi possível criar a célula. Verifique os dados e tente novamente.";
  }
}
