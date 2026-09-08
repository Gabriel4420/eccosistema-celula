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
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { TranslationKey, TranslationParams } from "@/src/shared/i18n/dictionaries";
import { createCell } from "@/src/features/cells/api/cells-api";
import { AssignmentSelect } from "./assignment-select";

const CELLS_CACHE = "cells";

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
  const { t } = useI18n();
  const { api } = useSession();
  const router = useRouter();

  const DAYS: ReadonlyArray<{ readonly value: string; readonly label: string }> = [
    { value: "MONDAY", label: t("cells.day.monday") },
    { value: "TUESDAY", label: t("cells.day.tuesday") },
    { value: "WEDNESDAY", label: t("cells.day.wednesday") },
    { value: "THURSDAY", label: t("cells.day.thursday") },
    { value: "FRIDAY", label: t("cells.day.friday") },
    { value: "SATURDAY", label: t("cells.day.saturday") },
    { value: "SUNDAY", label: t("cells.day.sunday") }
  ];
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
        title: t("cells.create.toast.created"),
        description: cell.name
      });
      router.push(`/cells/${cell.id}`);
    } catch (cause) {
      const message = messageForError(cause, t);
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="new-cell-title">
      <div className="page-header">
        <h1 className="page-title" id="new-cell-title">
          {t("cells.new")}
        </h1>
        <Link className="breadcrumbs__link" href="/cells">
          {t("cells.create.back")}
        </Link>
      </div>

      {formError ? (
        <Alert variant="error" title={t("cells.create.alertTitle")}>
          {formError}
        </Alert>
      ) : null}

      <form className="fieldset" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">{t("cells.create.legend.identification")}</legend>
          <TextField
            label={t("cells.column.code")}
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            hint={t("cells.create.hint.code")}
            error={fieldErrors.code}
            required
          />
          <TextField
            label={t("cells.detail.field.name")}
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            hint={t("cells.create.hint.name")}
            error={fieldErrors.name}
            required
          />
          <SelectField
            label={t("common.status")}
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as CreateStatus)}
            error={fieldErrors.status}
            options={[
              { value: "FORMING", label: t("cells.status.formative") },
              { value: "ACTIVE", label: t("cells.status.active") },
              { value: "SUSPENDED", label: t("cells.status.suspended") }
            ]}
            hint={t("cells.create.hint.status")}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset__legend">{t("cells.create.legend.leadership")}</legend>
          <AssignmentSelect
            label={t("cells.column.leader")}
            kind="LEADER"
            value={leaderId}
            onChange={setLeaderId}
            error={fieldErrors.leaderId}
            required={leaderRequired}
            hint={t("cells.create.hint.leader")}
          />
          <AssignmentSelect
            label={t("cells.detail.label.supervisor")}
            kind="SUPERVISOR"
            value={supervisorId}
            onChange={setSupervisorId}
            error={fieldErrors.supervisorId}
            required={leaderRequired}
            hint={t("cells.create.hint.supervisor")}
          />
          <AssignmentSelect
            label={t("cells.detail.label.trainee")}
            kind="TRAINEE"
            value={traineeLeaderId}
            onChange={setTraineeLeaderId}
            error={fieldErrors.traineeLeaderId}
            hint={t("cells.create.hint.trainee")}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset__legend">{t("cells.create.legend.meeting")}</legend>
          <SelectField
            label={t("cells.detail.field.meetingDay")}
            name="meetingDay"
            value={meetingDay}
            onChange={(event) => setMeetingDay(event.target.value)}
            error={fieldErrors.meetingDay}
            options={DAYS}
            required
          />
          <TextField
            label={t("cells.detail.field.time")}
            name="meetingTime"
            value={meetingTime}
            onChange={(event) => setMeetingTime(event.target.value)}
            hint={t("cells.create.hint.time")}
            error={fieldErrors.meetingTime}
            required
          />
          <TextField
            label={t("cells.detail.field.address")}
            name="address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            hint={t("cells.create.hint.address")}
            error={fieldErrors.address}
            required
          />
        </fieldset>

        <div className="dialog-panel__actions" style={{ justifyContent: "flex-start", marginTop: "var(--space-4)" }}>
          <Button type="submit" icon={Plus} loading={submitting} loadingLabel={t("cells.create.submitting")}>
            {t("cells.create.submit")}
          </Button>
          <Link className="button button--secondary" href="/cells">
            {t("common.cancel")}
          </Link>
        </div>
      </form>
    </section>
  );
}

function messageForError(cause: unknown, t: (key: TranslationKey, params?: TranslationParams) => string): string {
  if (!(cause instanceof ApiError)) {
    return t("cells.create.error.generic");
  }
  switch (cause.code) {
    case "CELL_CODE_CONFLICT":
      return t("cells.create.error.codeConflict");
    case "CELL_LEADER_NOT_ELIGIBLE":
      return t("cells.create.error.leaderNotEligible");
    case "CELL_SUPERVISOR_CONFLICT":
      return t("cells.create.error.supervisorConflict");
    case "CELL_LEADERSHIP_CANDIDATE_NOT_FOUND":
    case "CELL_SUPERVISOR_NOT_FOUND":
      return t("cells.create.error.candidateNotFound");
    case "IDEMPOTENCY_KEY_CONFLICT":
      return t("cells.create.error.idempotency");
    default:
      return t("cells.create.error.generic");
  }
}
