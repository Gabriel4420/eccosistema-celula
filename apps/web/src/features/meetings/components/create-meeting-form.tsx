"use client";

import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { createMeetingRequestSchema } from "@mission-atos/contracts";
import type { z } from "zod";
import { Alert, Button, TextField } from "@/src/shared/components";
import { ApiError } from "@/src/shared/api/api-error";
import { cacheStore } from "@/src/shared/cache/cache";
import { useSession } from "@/src/providers/session-provider";
import { toast } from "@/src/shared/toast/toast-store";
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { TranslationKey, TranslationParams } from "@/src/shared/i18n/dictionaries";
import { createMeeting } from "@/src/features/meetings/api/meetings-api";
import { formatMeetingDate, toISODateString } from "@/src/features/meetings/lib/format";

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
  const { t, locale } = useI18n();
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
      toast({
        kind: "success",
        title: t("meetings.new.toast.created"),
        description: formatMeetingDate(meeting.meetingDate, locale)
      });
      router.push(`/cells/${cellId}/meetings/${meeting.id}`);
    } catch (cause) {
      setFormError(messageForError(cause, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="new-meeting-title">
      <div className="page-header">
        <h1 className="page-title" id="new-meeting-title">
          {t("meetings.new")}
        </h1>
        <Link className="breadcrumbs__link" href={`/cells/${cellId}/meetings`}>
          {t("meetings.detail.back")}
        </Link>
      </div>

      {formError ? (
        <Alert variant="error" title={t("meetings.new.alertTitle")}>
          {formError}
        </Alert>
      ) : null}

      <form className="fieldset" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">{t("meetings.new.legend.date")}</legend>
          <TextField
            label={t("meetings.column.date")}
            name="meetingDate"
            type="date"
            value={meetingDate}
            onChange={(event) => setMeetingDate(event.target.value)}
            hint={t("meetings.new.hint.date")}
            error={fieldErrors.meetingDate}
            required
          />
        </fieldset>

        <div className="dialog-panel__actions" style={{ justifyContent: "flex-start", marginTop: "var(--space-4)" }}>
          <Button type="submit" icon={CalendarPlus} loading={submitting} loadingLabel={t("meetings.new.submitting")}>
            {t("meetings.new.submit")}
          </Button>
          <Link className="button button--secondary" href={`/cells/${cellId}/meetings`}>
            {t("common.cancel")}
          </Link>
        </div>
      </form>
    </section>
  );
}

function messageForError(cause: unknown, t: (key: TranslationKey, params?: TranslationParams) => string): string {
  if (!(cause instanceof ApiError)) {
    return t("meetings.new.error.generic");
  }
  switch (cause.code) {
    case "MEETING_DATE_CONFLICT":
      return t("meetings.new.error.dateConflict");
    case "MEETING_CELL_NOT_FOUND":
      return t("meetings.new.error.cellNotFound");
    case "MEETING_CELL_STATUS_INVALID":
      return t("meetings.new.error.cellStatusInvalid");
    case "MEETING_ACCESS_DENIED":
      return t("meetings.new.error.accessDenied");
    case "MEETING_STATUS_TRANSITION_INVALID":
      return t("meetings.new.error.transitionInvalid");
    case "MEETING_NOT_EDITABLE":
      return t("meetings.new.error.notEditable");
    case "MEETING_REPORT_NOT_EDITABLE":
      return t("meetings.new.error.reportNotEditable");
    case "MEETING_TRANSACTION_RETRY_EXHAUSTED":
      return t("meetings.new.error.retryExhausted");
    case "IDEMPOTENCY_KEY_CONFLICT":
      return t("meetings.new.error.idempotency");
    default:
      return t("meetings.new.error.generic");
  }
}
