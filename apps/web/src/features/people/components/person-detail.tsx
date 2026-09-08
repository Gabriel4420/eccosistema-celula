"use client";

import Link from "next/link";
import { Save, UserX } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { normalizeChurchPhone } from "@mission-atos/contracts";
import {
  Alert,
  Button,
  Dialog,
  EmptyState,
  ErrorState,
  Skeleton,
  StatusBadge,
  TextareaField,
  TextField,
} from "@/src/shared/components";
import { Can } from "@/src/shared/auth/guards";
import { cacheStore } from "@/src/shared/cache/cache";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { toast } from "@/src/shared/toast/toast-store";
import { useI18n } from "@/src/shared/i18n/language-provider";
import {
  getPerson,
  updatePerson,
  updatePersonStatus,
} from "@/src/features/people/api/people-api";

const PEOPLE_CACHE = "people";

export function PersonDetail() {
  const { t } = useI18n();
  const { api } = useSession();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const {
    data: person,
    loading,
    error,
    reload,
  } = useRemoteQuery({
    fetcher: () => getPerson(api, id),
    cacheName: PEOPLE_CACHE,
    cacheKey: `detail:${id}`,
    ttlMs: 20_000,
  });

  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmInactivate, setConfirmInactivate] = useState(false);

  if (loading && !person) {
    return (
      <div aria-label={t("people.detail.loading")}>
        <Skeleton width="40%" height="2.5rem" />
        <Skeleton width="100%" height="8rem" />
      </div>
    );
  }

  if (error && !person) {
    return (
      <ErrorState title={t("people.error.load")} onRetry={() => void reload()}>
        {t("people.error.retry")}
      </ErrorState>
    );
  }

  if (!person) {
    return (
      <EmptyState title={t("people.detail.empty")}>
        {t("people.detail.empty.desc")}
      </EmptyState>
    );
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    const formData = new FormData(event.currentTarget);
    const payload: Record<string, string> = {};
    const fields: ReadonlyArray<[string, string | null]> = [
      ["fullName", person.fullName],
      ["email", person.email],
      ["birthDate", person.birthDate],
      ["gender", person.gender],
    ];
    for (const [key, original] of fields) {
      const value = String(formData.get(key) ?? "").trim();
      if (value !== (original ?? "")) payload[key] = value;
    }
    const phone = normalizeChurchPhone(String(formData.get("phone") ?? ""));
    if (phone !== (person.phone ?? "")) payload.phone = phone;
    const observations = String(formData.get("observations") ?? "").trim();
    if (observations !== (person.observations ?? ""))
      payload.observations = observations;
    if (Object.keys(payload).length === 0) {
      toast({
        kind: "info",
        title: t("people.toast.noChange"),
        description: t("people.toast.noChange.desc"),
      });
      return;
    }
    setBusy(true);
    try {
      await updatePerson(api, id, payload);
      cacheStore(PEOPLE_CACHE).invalidatePrefix("detail");
      cacheStore(PEOPLE_CACHE).invalidatePrefix("page");
      await reload();
      toast({
        kind: "success",
        title: t("people.detail.toast.updated"),
        description: t("people.detail.saved.desc"),
      });
    } catch {
      setFeedback({
        kind: "error",
        message: t("people.detail.error.save"),
      });
    } finally {
      setBusy(false);
    }
  };

  const runInactivate = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await updatePersonStatus(api, id, "INACTIVE");
      cacheStore(PEOPLE_CACHE).invalidatePrefix("detail");
      cacheStore(PEOPLE_CACHE).invalidatePrefix("page");
      setConfirmInactivate(false);
      await reload();
      toast({
        kind: "success",
        title: t("people.toast.inactivated"),
        description: t("people.toast.inactivated.desc"),
      });
    } catch {
      setFeedback({
        kind: "error",
        message: t("people.detail.error.inactivate"),
      });
    } finally {
      setBusy(false);
    }
  };

  function formatPhone(value: string | null | undefined): string {
    const digits = (value ?? "").replace(/\D/g, "");

    const patterns: Array<[RegExp, string]> = [
      [/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3"], // 11 dígitos → celular
      [/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3"], // 10 dígitos → fixo
      [/^(\d{2})(\d{2})(\d{5})(\d{4})$/, "+$1 ($2) $3-$4"], // com DDI (+55)
    ];

    for (const [re, format] of patterns) {
      if (re.test(digits)) return digits.replace(re, format);
    }

    return digits; // fallback: retorna só os dígitos
  }

  return (
    <section aria-labelledby="person-title">
      <div className="page-header">
        <h1 className="page-title" id="person-title">
          {person.fullName}
        </h1>
        <Link className="breadcrumbs__link" href="/people">
          {t("people.detail.back")}
        </Link>
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

      <div className="detail-list" style={{ marginBottom: "var(--space-5)" }}>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("common.status")}</span>
          <StatusBadge status={person.status} />
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">
            {t("people.column.email")}
          </span>
          <span className="detail-list__value">{person.email ?? "—"}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">
            {t("people.column.phone")}
          </span>
          <span className="detail-list__value">
            {formatPhone(person.phone) ?? "—"}
          </span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">
            {t("people.column.birthDate")}
          </span>
          <span className="detail-list__value">{person.birthDate ?? "—"}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">
            {t("people.column.gender")}
          </span>
          <span className="detail-list__value">{person.gender ?? "—"}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">
            {t("people.detail.label.registration")}
          </span>
          <span className="detail-list__value">
            {person.createdAt
              .toString()
              .substring(0, 10)
              .match(/[\d-]+/)?.[0] || "—"}
          </span>
        </div>
      </div>

      <Can capability="editPeople">
        <form className="fieldset" onSubmit={(event) => void handleSave(event)}>
          <fieldset className="fieldset">
            <legend className="fieldset__legend">{t("people.detail.edit")}</legend>
            <TextField
              label={t("people.detail.field.fullName")}
              name="fullName"
              defaultValue={person.fullName}
              required
            />
            <TextField
              label={t("people.detail.label.gender")}
              name="gender"
              defaultValue={person.gender ?? ""}
            />
            <TextField
              label={t("people.detail.field.birthDate")}
              type="date"
              name="birthDate"
              defaultValue={person.birthDate ?? ""}
            />
            <TextField
              label={t("people.column.email")}
              type="email"
              name="email"
              mask="email"
              defaultValue={person.email ?? ""}
            />
            <TextField
              label={t("people.column.phone")}
              name="phone"
              mask="phone"
              defaultValue={person.phone ?? ""}
            />
            <Can capability="viewPersonObservations">
              <TextareaField
                label={t("people.detail.field.observations")}
                name="observations"
                rows={4}
                defaultValue={person.observations ?? ""}
              />
            </Can>
            <Button
              type="submit"
              icon={Save}
              loading={busy}
              loadingLabel={t("common.saving")}
            >
              {t("people.detail.saveChanges")}
            </Button>
          </fieldset>
        </form>
      </Can>

      <Can capability="changePersonStatus">
        <div className="toolbar" style={{ marginTop: "var(--space-6)" }}>
          {person.status === "ACTIVE" ? (
            <Button
              variant="danger"
              icon={UserX}
              onClick={() => setConfirmInactivate(true)}
            >
              {t("people.detail.inactivatePerson")}
            </Button>
          ) : null}
        </div>
      </Can>

      <Dialog
        open={confirmInactivate}
        onClose={() => setConfirmInactivate(false)}
        title={t("people.detail.inactivate.title")}
        description={t("people.detail.inactivate.desc")}
      >
        <div className="dialog-panel__actions">
          <Button
            variant="secondary"
            onClick={() => setConfirmInactivate(false)}
            disabled={busy}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="danger"
            icon={UserX}
            loading={busy}
            loadingLabel={t("people.detail.inactivate.inactivating")}
            onClick={() => void runInactivate()}
          >
            {t("people.detail.inactivate.action")}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
