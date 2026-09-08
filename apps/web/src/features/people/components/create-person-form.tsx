"use client";

import { useRouter } from "next/navigation";
import { UserRoundPlus } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Alert, Button, TextareaField, TextField } from "@/src/shared/components";
import { ApiError } from "@/src/shared/api/api-error";
import { cacheStore } from "@/src/shared/cache/cache";
import { useSession } from "@/src/providers/session-provider";
import { toast } from "@/src/shared/toast/toast-store";
import { useI18n } from "@/src/shared/i18n/language-provider";
import { createPerson } from "@/src/features/people/api/people-api";

const PEOPLE_CACHE = "people";

export function CreatePersonForm() {
  const { t } = useI18n();
  const { api } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    const formData = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const person = await createPerson(api, {
        fullName: String(formData.get("fullName") ?? "").trim(),
        phone: String(formData.get("phone") ?? "").trim() || undefined,
        email: String(formData.get("email") ?? "").trim() || undefined,
        birthDate: String(formData.get("birthDate") ?? "").trim() || undefined,
        gender: String(formData.get("gender") ?? "").trim() || undefined,
        observations:
          String(formData.get("observations") ?? "").trim() || undefined,
      });
      cacheStore(PEOPLE_CACHE).invalidatePrefix("page");
      toast({
        kind: "success",
        title: t("people.toast.created"),
        description: person.fullName
      });
      router.push(`/people/${person.id}`);
    } catch (error) {
      const message =
        error instanceof ApiError && error.code === "PERSON_DUPLICATE"
          ? t("people.new.error.duplicate")
          : t("people.new.error.generic");
      setFeedback({ kind: "error", message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="create-person-title">
      <div className="page-header">
        <h1 className="page-title" id="create-person-title">
          {t("people.new")}
        </h1>
        <p className="page-description">{t("people.new.description")}</p>
      </div>

      {feedback ? (
        <Alert
          variant={feedback.kind}
          title={
            feedback.kind === "success"
              ? t("people.alert.success")
              : t("people.alert.failure")
          }
        >
          {feedback.message}
        </Alert>
      ) : null}

      <form className="fieldset" onSubmit={(event) => void handleSubmit(event)}>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">
            {t("people.new.legend.identification")}
          </legend>
          <TextField
            label={t("people.detail.field.fullName")}
            name="fullName"
            required
            hint={t("people.new.hint.name")}
          />
          <TextField
            label={t("people.detail.label.gender")}
            name="gender"
            hint={t("people.new.hint.gender")}
          />
          <TextField
            label={t("people.detail.field.birthDate")}
            type="date"
            name="birthDate"
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset__legend">
            {t("people.new.legend.contact")}
          </legend>
          <TextField
            label={t("people.column.email")}
            type="email"
            name="email"
            mask="email"
            hint={t("people.new.hint.email")}
          />
          <TextField
            label={t("people.column.phone")}
            name="phone"
            mask="phone"
            hint={t("people.new.hint.phone")}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset__legend">
            {t("people.new.legend.observations")}
          </legend>
          <TextareaField
            label={t("people.detail.field.observations")}
            name="observations"
            rows={4}
            hint={t("people.new.hint.observations")}
          />
        </fieldset>

        <div className="toolbar">
          <Button
            type="submit"
            icon={UserRoundPlus}
            loading={busy}
            loadingLabel={t("people.new.submitting")}
          >
            {t("people.new.submit")}
          </Button>
        </div>
      </form>
    </section>
  );
}
