"use client";

import {
  accessibilityContrasts,
  accessibilityFocusModes,
  accessibilityMotions,
  accessibilityTextScales,
  churchWeekDays,
  settingsDateFormats,
  settingsLocales,
  settingsThemes
} from "@mission-atos/contracts";
import type {
  AccessibilityContrast,
  AccessibilityFocusMode,
  AccessibilityMotion,
  AccessibilityTextScale,
  ChurchWeekDay,
  SettingsDateFormat,
  SettingsLocale,
  SettingsTheme,
  UpdateChurchSettingsRequest,
  UpdateOwnPreferencesRequest
} from "@mission-atos/contracts";
import { Save } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button, EmptyState, ErrorState, SelectField, Skeleton, TextField } from "@/src/shared/components";
import { Can } from "@/src/shared/auth/guards";
import { cacheStore } from "@/src/shared/cache/cache";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { toast } from "@/src/shared/toast/toast-store";
import { getChurchSettings, updateChurchSettings } from "@/src/features/church/api/church-api";
import { getOwnPreferences, updateOwnPreferences } from "@/src/features/settings/api/settings-api";
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { AppLocale } from "@/src/shared/i18n/dictionaries";
import { applyAccessibilityPreferences } from "@/src/shared/accessibility/accessibility-preferences";

const OWN_CACHE = "settings";
const CHURCH_CACHE = "church";
const THEME_STORAGE_KEY = "mission-atos-theme";

function applySavedTheme(theme: SettingsTheme) {
  if (typeof window === "undefined") return;
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function invalidateDependentCaches(): void {
  for (const name of ["reports", "meetings", "attendance", "analytics", "cells"] as const) {
    cacheStore(name).invalidatePrefix("");
  }
}

export function SettingsView() {
  const { api, capabilities } = useSession();
  const canEditChurch = capabilities.editChurch;

  const prefsQuery = useRemoteQuery({
    fetcher: () => getOwnPreferences(api),
    cacheName: OWN_CACHE,
    cacheKey: "own",
    ttlMs: 30_000
  });
  const churchSettingsQuery = useRemoteQuery({
    fetcher: () => getChurchSettings(api),
    cacheName: CHURCH_CACHE,
    cacheKey: "settings",
    ttlMs: 30_000,
    enabled: canEditChurch
  });

  const prefs = prefsQuery.data;
  const settings = churchSettingsQuery.data;
  const { t, changeLanguage } = useI18n();

  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingRegional, setSavingRegional] = useState(false);
  const [savingOperacional, setSavingOperacional] = useState(false);

  const churchLoading = canEditChurch && churchSettingsQuery.loading && !settings;
  const churchError = canEditChurch && churchSettingsQuery.error && !settings;

  if ((prefsQuery.loading && !prefs) || churchLoading) {
    return (
      <div aria-label={t("settings.loading")}>
        <Skeleton width="45%" height="2.5rem" />
        <Skeleton width="100%" height="6rem" />
        <Skeleton width="100%" height="6rem" />
      </div>
    );
  }

  if ((prefsQuery.error && !prefs) || churchError) {
    return (
      <ErrorState
        title={t("settings.load.error")}
        onRetry={() => {
          void prefsQuery.reload();
          if (canEditChurch) void churchSettingsQuery.reload();
        }}
      >
        {t("settings.load.retry")}
      </ErrorState>
    );
  }

  if (!prefs) {
    return <EmptyState title={t("settings.unavailable")}>{t("settings.unavailable.desc")}</EmptyState>;
  }

  const handleSavePreferences = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const language = String(formData.get("language") ?? "") as SettingsLocale;
    const dateFormat = String(formData.get("dateFormat") ?? "") as SettingsDateFormat;
    const theme = String(formData.get("theme") ?? "") as SettingsTheme;
    const accessibilityContrast = String(formData.get("accessibilityContrast") ?? "") as AccessibilityContrast;
    const accessibilityTextScale = String(formData.get("accessibilityTextScale") ?? "") as AccessibilityTextScale;
    const accessibilityMotion = String(formData.get("accessibilityMotion") ?? "") as AccessibilityMotion;
    const accessibilityFocus = String(formData.get("accessibilityFocus") ?? "") as AccessibilityFocusMode;
    const rawTimezone = String(formData.get("displayTimezone") ?? "").trim();
    const displayTimezone = rawTimezone === "" ? null : rawTimezone;

    const payload: UpdateOwnPreferencesRequest = {};
    if (language !== prefs.language) payload.language = language;
    if (dateFormat !== prefs.dateFormat) payload.dateFormat = dateFormat;
    if (theme !== prefs.theme) payload.theme = theme;
    if (accessibilityContrast !== prefs.accessibilityContrast) payload.accessibilityContrast = accessibilityContrast;
    if (accessibilityTextScale !== prefs.accessibilityTextScale) payload.accessibilityTextScale = accessibilityTextScale;
    if (accessibilityMotion !== prefs.accessibilityMotion) payload.accessibilityMotion = accessibilityMotion;
    if (accessibilityFocus !== prefs.accessibilityFocus) payload.accessibilityFocus = accessibilityFocus;
    if (displayTimezone !== prefs.displayTimezone) payload.displayTimezone = displayTimezone;

    if (Object.keys(payload).length === 0) {
      toast({
        kind: "info",
        title: t("settings.toast.noop"),
        description: t("settings.toast.noop.desc")
      });
      return;
    }

    setSavingPrefs(true);
    try {
      await updateOwnPreferences(api, payload);
      cacheStore(OWN_CACHE).invalidatePrefix("own");
      await prefsQuery.reload();
      if (payload.theme) applySavedTheme(payload.theme);
      if (payload.language) changeLanguage(payload.language as AppLocale);
      applyAccessibilityPreferences({
        accessibilityContrast,
        accessibilityTextScale,
        accessibilityMotion,
        accessibilityFocus
      });
      toast({
        kind: "success",
        title: t("settings.toast.saved"),
        description: t("settings.toast.saved.desc")
      });
    } catch {
      toast({
        kind: "error",
        title: t("common.error"),
        description: t("settings.toast.error")
      });
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSaveRegional = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings) return;
    const formData = new FormData(event.currentTarget);
    const timezone = String(formData.get("timezone") ?? "").trim();
    const weekStartsOn = String(formData.get("weekStartsOn") ?? "") as ChurchWeekDay;

    const payload: UpdateChurchSettingsRequest = {};
    if (timezone !== settings.timezone && timezone !== "") payload.timezone = timezone;
    if (weekStartsOn !== settings.weekStartsOn) payload.weekStartsOn = weekStartsOn;

    if (Object.keys(payload).length === 0) {
      toast({
        kind: "info",
        title: t("settings.toast.noop"),
        description: t("settings.toast.noop.desc")
      });
      return;
    }

    setSavingRegional(true);
    try {
      await updateChurchSettings(api, payload);
      cacheStore(CHURCH_CACHE).invalidatePrefix("settings");
      invalidateDependentCaches();
      await churchSettingsQuery.reload();
      toast({
        kind: "success",
        title: t("settings.toast.saved"),
        description: t("settings.toast.saved.desc")
      });
    } catch {
      toast({
        kind: "error",
        title: t("common.error"),
        description: t("settings.toast.error")
      });
    } finally {
      setSavingRegional(false);
    }
  };

  const handleSaveOperacional = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings) return;
    const formData = new FormData(event.currentTarget);
    const value = Number(String(formData.get("reportDeadlineHours") ?? "").trim());
    if (!Number.isInteger(value) || value < 1 || value > 720) {
      toast({
        kind: "error",
        title: t("common.error"),
        description: t("settings.toast.error")
      });
      return;
    }
    if (value === settings.reportDeadlineHours) {
      toast({
        kind: "info",
        title: t("settings.toast.noop"),
        description: t("settings.toast.noop.desc")
      });
      return;
    }

    setSavingOperacional(true);
    try {
      await updateChurchSettings(api, { reportDeadlineHours: value });
      cacheStore(CHURCH_CACHE).invalidatePrefix("settings");
      invalidateDependentCaches();
      await churchSettingsQuery.reload();
      toast({
        kind: "success",
        title: t("settings.toast.saved"),
        description: t("settings.toast.saved.desc")
      });
    } catch {
      toast({
        kind: "error",
        title: t("common.error"),
        description: t("settings.toast.error")
      });
    } finally {
      setSavingOperacional(false);
    }
  };

  return (
    <section aria-labelledby="settings-title">
      <div className="page-header">
        <h1 className="page-title" id="settings-title">
          {t("settings.page.title")}
        </h1>
        <p className="page-description">{t("settings.page.description")}</p>
      </div>

      <Can capability="editChurch">
        {settings ? (
          <>
            <form className="fieldset" onSubmit={(event) => void handleSaveRegional(event)}>
              <fieldset className="fieldset">
                <legend className="fieldset__legend">{t("settings.section.regional")}</legend>
                <TextField
                  label={t("settings.field.timezone")}
                  name="timezone"
                  defaultValue={settings.timezone}
                  hint={t("settings.field.timezone.hint")}
                  required
                />
                <SelectField
                  label={t("settings.field.weekStartsOn")}
                  name="weekStartsOn"
                  defaultValue={settings.weekStartsOn}
                  options={churchWeekDays.map((day) => ({ value: day, label: day }))}
                  required
                />
                <Button type="submit" icon={Save} loading={savingRegional} loadingLabel={t("settings.btn.saving")}>
                  {t("settings.btn.save")}
                </Button>
              </fieldset>
            </form>

            <form className="fieldset" style={{ marginTop: "var(--space-6)" }} onSubmit={(event) => void handleSaveOperacional(event)}>
              <fieldset className="fieldset">
                <legend className="fieldset__legend">{t("settings.section.operacional")}</legend>
                <TextField
                  label={t("settings.field.deadlineHours")}
                  name="reportDeadlineHours"
                  type="number"
                  min={1}
                  max={720}
                  defaultValue={String(settings.reportDeadlineHours)}
                  hint={t("settings.field.deadlineHours.hint")}
                  required
                />
                <Button type="submit" icon={Save} loading={savingOperacional} loadingLabel={t("settings.btn.saving")}>
                  {t("settings.btn.save")}
                </Button>
              </fieldset>
            </form>
          </>
        ) : null}
      </Can>

      <form className="fieldset" style={{ marginTop: canEditChurch ? "var(--space-6)" : undefined }} onSubmit={(event) => void handleSavePreferences(event)}>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">{t("settings.section.preferencias")}</legend>
          <SelectField
            label={t("settings.field.language")}
            name="language"
            defaultValue={prefs.language}
            options={settingsLocales.map((locale) => ({
              value: locale,
              label: t(`settings.locale.${locale}`)
            }))}
            required
          />
          <TextField
            label={t("settings.field.displayTimezone")}
            name="displayTimezone"
            defaultValue={prefs.displayTimezone ?? ""}
            hint={t("settings.field.displayTimezone.hint")}
          />
          <SelectField
            label={t("settings.field.dateFormat")}
            name="dateFormat"
            defaultValue={prefs.dateFormat}
            options={settingsDateFormats.map((format) => ({ value: format, label: format }))}
            required
          />
          <SelectField
            label={t("settings.field.theme")}
            name="theme"
            defaultValue={prefs.theme}
            options={settingsThemes.map((theme) => ({
              value: theme,
              label: t(`settings.theme.${theme}`)
            }))}
            required
          />
          <SelectField
            label={t("settings.field.accessibilityContrast")}
            name="accessibilityContrast"
            defaultValue={prefs.accessibilityContrast}
            options={accessibilityContrasts.map((value) => ({ value, label: t(`settings.accessibility.${value}`) }))}
            required
          />
          <SelectField
            label={t("settings.field.accessibilityTextScale")}
            name="accessibilityTextScale"
            defaultValue={prefs.accessibilityTextScale}
            options={accessibilityTextScales.map((value) => ({ value, label: t(`settings.accessibility.${value === "extra-large" ? "extraLarge" : value}`) }))}
            required
          />
          <SelectField
            label={t("settings.field.accessibilityMotion")}
            name="accessibilityMotion"
            defaultValue={prefs.accessibilityMotion}
            options={accessibilityMotions.map((value) => ({ value, label: t(`settings.accessibility.${value}`) }))}
            required
          />
          <SelectField
            label={t("settings.field.accessibilityFocus")}
            name="accessibilityFocus"
            defaultValue={prefs.accessibilityFocus}
            options={accessibilityFocusModes.map((value) => ({ value, label: t(`settings.accessibility.${value}`) }))}
            required
          />
          <Button type="submit" icon={Save} loading={savingPrefs} loadingLabel={t("settings.btn.saving")}>
            {t("settings.btn.save")}
          </Button>
        </fieldset>
      </form>
    </section>
  );
}
