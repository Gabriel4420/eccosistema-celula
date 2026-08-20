"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { createMeetingRequestSchema } from "@mission-atos/contracts";
import type { z } from "zod";
import { Alert, Button, TextField } from "@/src/shared/components";
import { ApiError } from "@/src/shared/api/api-error";
import { cacheStore } from "@/src/shared/cache/cache";
import { useSession } from "@/src/providers/session-provider";
import { createMeeting } from "@/src/features/meetings/api/meetings-api";
import { toISODateString } from "@/src/features/meetings/lib/format";

const MEETINGS_CACHE = "meetings";

function errorsFromIssue(issues: readonly z.ZodIssue[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] = issue.message;
  }
  return errors;
}

export function CreateMeetingForm({ cellId }: { readonly cellId: string }) {
  const { api } = useSession();
  const router = useRouter();
  const today = toISODateString(new Date());
  const [meetingDate, setMeetingDate] = useState(today);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  const lastPayload = useRef<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = createMeetingRequestSchema.safeParse({ meetingDate });
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
      const meeting = await createMeeting(api, cellId, parsed.data, idempotencyKey.current);
      cacheStore(MEETINGS_CACHE).invalidatePrefix("page");
      router.push(`/cells/${cellId}/meetings/${meeting.id}`);
    } catch (cause) {
      setFormError(messageForError(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="new-meeting-title">
      <div className="page-header">
        <h1 className="page-title" id="new-meeting-title">
          Novo encontro
        </h1>
        <Link className="breadcrumbs__link" href={`/cells/${cellId}/meetings`}>
          Voltar para encontros
        </Link>
      </div>

      {formError ? (
        <Alert variant="error" title="Não foi possível criar">
          {formError}
        </Alert>
      ) : null}

      <form className="fieldset" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">Data do encontro</legend>
          <TextField
            label="Data"
            name="meetingDate"
            type="date"
            value={meetingDate}
            onChange={(event) => setMeetingDate(event.target.value)}
            hint="Formato AAAA-MM-DD"
            error={fieldErrors.meetingDate}
            required
          />
        </fieldset>

        <div className="dialog-panel__actions" style={{ justifyContent: "flex-start", marginTop: "var(--space-4)" }}>
          <Button type="submit" loading={submitting} loadingLabel="Criando…">
            Criar encontro
          </Button>
          <Link className="button button--secondary" href={`/cells/${cellId}/meetings`}>
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}

function messageForError(cause: unknown): string {
  if (!(cause instanceof ApiError)) {
    return "Não foi possível criar o encontro. Verifique os dados e tente novamente.";
  }
  switch (cause.code) {
    case "MEETING_DATE_CONFLICT":
      return "Já existe um encontro agendado para esta célula nesta data.";
    case "MEETING_CELL_NOT_FOUND":
      return "A célula informada não foi encontrada.";
    case "MEETING_CELL_STATUS_INVALID":
      return "A célula precisa estar ativa para agendar encontros.";
    case "MEETING_ACCESS_DENIED":
      return "Você não tem permissão para criar encontros nesta célula.";
    case "MEETING_STATUS_TRANSITION_INVALID":
      return "Transição de status não permitida para este encontro.";
    case "MEETING_NOT_EDITABLE":
      return "Este encontro não pode mais ser editado.";
    case "MEETING_REPORT_NOT_EDITABLE":
      return "Não é possível editar o relatório de um encontro cancelado.";
    case "MEETING_TRANSACTION_RETRY_EXHAUSTED":
      return "Muitas tentativas simultâneas. Aguarde um momento e tente novamente.";
    case "IDEMPOTENCY_KEY_CONFLICT":
      return "A tentativa anterior conflitou com outra. Tente novamente.";
    default:
      return "Não foi possível criar o encontro. Verifique os dados e tente novamente.";
  }
}
