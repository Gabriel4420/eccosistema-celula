"use client";

import { churchWeekDays, normalizeChurchPhone } from "@mission-atos/contracts";
import { Save } from "lucide-react";
import type { ChurchResponse } from "@mission-atos/contracts";
import { useState } from "react";
import type { FormEvent } from "react";
import { Alert, Button, EmptyState, ErrorState, SelectField, Skeleton, TextField } from "@/src/shared/components";
import { Can } from "@/src/shared/auth/guards";
import { cacheStore } from "@/src/shared/cache/cache";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { toast } from "@/src/shared/toast/toast-store";
import { getChurch, getChurchSettings, updateChurch, updateChurchSettings } from "@/src/features/church/api/church-api";
import { ChurchAddressFields } from "@/src/features/church/components/church-address-fields";
import { useI18n } from "@/src/shared/i18n/language-provider";

const CHURCH_CACHE = "church";

export function ChurchSettingsView() {
  const { t } = useI18n();
  const { api } = useSession();
  const { data: church, loading, error, reload } = useRemoteQuery({
    fetcher: () => getChurch(api),
    cacheName: CHURCH_CACHE,
    cacheKey: "data",
    ttlMs: 30_000
  });
  const { data: settings, loading: settingsLoading, error: settingsError, reload: reloadSettings } = useRemoteQuery({
    fetcher: () => getChurchSettings(api),
    cacheName: CHURCH_CACHE,
    cacheKey: "settings",
    ttlMs: 30_000
  });

  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  if ((loading && !church) || (settingsLoading && !settings)) {
    return (
      <div aria-label={t("church.loading.church")}>
        <Skeleton width="40%" height="2.5rem" />
        <Skeleton width="100%" height="8rem" />
      </div>
    );
  }

  if ((error && !church) || (settingsError && !settings)) {
    return (
      <ErrorState title={t("church.error.load")} onRetry={() => { void reload(); void reloadSettings(); }}>
        {t("church.error.retry")}
      </ErrorState>
    );
  }

  if (!church || !settings) {
    return <EmptyState title={t("church.empty.title")}>{t("church.empty.desc")}</EmptyState>;
  }

  const handleSaveChurch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    const formData = new FormData(event.currentTarget);
    const payload: Record<string, string | null> = {};
    const fields: ReadonlyArray<[keyof ChurchResponse, string]> = [
      ["name", String(formData.get("name") ?? "").trim()],
      ["slug", String(formData.get("slug") ?? "").trim()],
      ["email", String(formData.get("email") ?? "").trim()],
      ["phone", normalizeChurchPhone(String(formData.get("phone") ?? ""))]
    ];
    for (const [key, value] of fields) {
      const original = church[key];
      if (key === "name" || key === "slug") {
        if (value !== original && value !== "") payload[key] = value;
      } else {
        if (value !== (original ?? "")) payload[key] = value === "" ? null : value;
      }
    }
    const addressFields: ReadonlyArray<[string, string]> = [
      ["line", String(formData.get("addressLine") ?? "").trim()],
      ["number", String(formData.get("addressNumber") ?? "").trim()],
      ["complement", String(formData.get("addressComplement") ?? "").trim()],
      ["neighborhood", String(formData.get("neighborhood") ?? "").trim()],
      ["city", String(formData.get("city") ?? "").trim()],
      ["state", String(formData.get("state") ?? "").trim()],
      ["postalCode", String(formData.get("postalCode") ?? "").trim()]
    ];
    const addressPayloadKeys: Record<string, string> = {
      line: "addressLine",
      number: "addressNumber",
      complement: "addressComplement",
      neighborhood: "neighborhood",
      city: "city",
      state: "state",
      postalCode: "postalCode"
    };
    for (const [key, value] of addressFields) {
      const original = church.address[key as keyof typeof church.address];
      if (value !== (original ?? "")) {
        const payloadKey = addressPayloadKeys[key] ?? key;
        payload[payloadKey] = value === "" ? null : value;
      }
    }

    if (Object.keys(payload).length === 0) {
      toast({
        kind: "info",
        title: t("church.toast.noChange"),
        description: t("church.toast.noChange.desc")
      });
      return;
    }

    setSaving(true);
    try {
      await updateChurch(api, payload);
      cacheStore(CHURCH_CACHE).invalidatePrefix("data");
      await reload();
      toast({
        kind: "success",
        title: t("church.toast.savedData"),
        description: t("church.toast.savedData.desc")
      });
    } catch {
      setFeedback({ kind: "error", message: t("church.error.save") });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    const formData = new FormData(event.currentTarget);
    const payload: Record<string, string> = {};
    const timezone = String(formData.get("timezone") ?? "").trim();
    const weekStartsOn = String(formData.get("weekStartsOn") ?? "");
    if (timezone !== settings.timezone && timezone !== "") payload.timezone = timezone;
    if (weekStartsOn !== settings.weekStartsOn && weekStartsOn !== "") payload.weekStartsOn = weekStartsOn;
    if (Object.keys(payload).length === 0) {
      toast({
        kind: "info",
        title: t("church.toast.noChange"),
        description: t("church.toast.noChangeSettings.desc")
      });
      return;
    }
    setSaving(true);
    try {
      await updateChurchSettings(api, payload);
      cacheStore(CHURCH_CACHE).invalidatePrefix("settings");
      await reloadSettings();
      toast({
        kind: "success",
        title: t("church.toast.savedSettings"),
        description: t("church.toast.savedSettings.desc")
      });
    } catch {
      setFeedback({ kind: "error", message: t("church.error.saveSettings") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="church-title">
      <div className="page-header">
        <h1 className="page-title" id="church-title">
          {t("church.page.title")}
        </h1>
        <p className="page-description">
          {t("church.page.description")}
        </p>
      </div>

      {feedback ? (
        <Alert variant={feedback.kind} title={feedback.kind === "success" ? t("common.success") : t("common.failure")}>
          {feedback.message}
        </Alert>
      ) : null}

      <form className="fieldset" onSubmit={(event) => void handleSaveChurch(event)}>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">{t("church.section.institutional")}</legend>
          <TextField label={t("church.field.name")} name="name" defaultValue={church.name} required />
          <TextField
            label={t("church.field.slug")}
            name="slug"
            defaultValue={church.slug}
            hint={t("church.hint.slug")}
            required
          />
          <TextField label={t("church.field.email")} type="email" name="email" mask="email" defaultValue={church.email ?? ""} />
          <TextField label={t("church.label.phone")} name="phone" mask="phone" defaultValue={church.phone ?? ""} hint={t("church.hint.phone")} />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset__legend">{t("church.section.address")}</legend>
          <ChurchAddressFields address={church.address} />
        </fieldset>

        <Can capability="editChurch">
          <Button type="submit" icon={Save} loading={saving} loadingLabel={t("church.saving")}>
            {t("church.saveData")}
          </Button>
        </Can>
      </form>

      <form className="fieldset" style={{ marginTop: "var(--space-6)" }} onSubmit={(event) => void handleSaveSettings(event)}>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">{t("church.section.settings")}</legend>
          <TextField
            label={t("church.field.timezone")}
            name="timezone"
            defaultValue={settings.timezone}
            hint={t("church.hint.timezone")}
            required
          />
          <SelectField
            label={t("church.field.weekStart")}
            name="weekStartsOn"
            defaultValue={settings.weekStartsOn}
            options={churchWeekDays.map((day) => ({ value: day, label: day }))}
            required
          />
          <Can capability="editChurch">
            <Button type="submit" icon={Save} loading={saving} loadingLabel={t("church.saving")}>
              {t("church.saveSettings")}
            </Button>
          </Can>
        </fieldset>
      </form>
    </section>
  );
}
