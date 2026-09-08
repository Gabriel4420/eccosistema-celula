"use client";

import { useState } from "react";
import { KeyRound, Save } from "lucide-react";
import type { FormEvent } from "react";
import {
  Alert,
  Button,
  Dialog,
  EmptyState,
  ErrorState,
  Skeleton,
  StatusBadge,
  TextField
} from "@/src/shared/components";
import { cacheStore } from "@/src/shared/cache/cache";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { toast } from "@/src/shared/toast/toast-store";
import {
  changeMyPassword,
  getMyProfile,
  updateMyProfile
} from "@/src/features/profile/api/profile-api";
import { ProfilePhoto } from "@/src/features/profile/components/profile-photo";
import { useI18n } from "@/src/shared/i18n/language-provider";

const PASSWORD_MIN = 12;
const PROFILE_CACHE = "profile";

export default function ProfilePage() {
  const { api, endSession } = useSession();
  const { t } = useI18n();
  const { data: profile, loading, error, reload } = useRemoteQuery({
    fetcher: () => getMyProfile(api),
    cacheName: PROFILE_CACHE,
    cacheKey: "me",
    ttlMs: 15_000
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<{
    current?: string;
    new?: string;
    confirm?: string;
  }>({});
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  if (loading && !profile) {
    return (
      <div aria-label={t("profile.loading")}>
        <Skeleton width="40%" height="2.5rem" />
        <Skeleton width="100%" height="8rem" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <ErrorState title={t("profile.load.error")} onRetry={() => void reload()}>
        {t("profile.load.retry")}
      </ErrorState>
    );
  }

  if (!profile) {
    return <EmptyState title={t("profile.unavailable")}>{t("profile.unavailable.desc")}</EmptyState>;
  }

  const firstNameValue = firstName === "" ? profile.firstName : firstName;
  const lastNameValue = lastName === "" ? profile.lastName : lastName;
  const hasNameChanges =
    (firstName !== "" && firstName !== profile.firstName) ||
    (lastName !== "" && lastName !== profile.lastName);

  const handleSaveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNameError(null);
    const payload: Record<string, string> = {};
    if (firstNameValue !== profile.firstName) payload.firstName = firstNameValue.trim();
    if (lastNameValue !== profile.lastName) payload.lastName = lastNameValue.trim();
    if (Object.keys(payload).length === 0) return;

    setSavingName(true);
    try {
      await updateMyProfile(api, payload);
      cacheStore(PROFILE_CACHE).invalidatePrefix("me");
      await reload();
      setFirstName("");
      setLastName("");
      toast({
        kind: "success",
        title: t("profile.toast.saved"),
        description: t("profile.toast.saved.desc")
      });
    } catch {
      setNameError(t("profile.toast.error"));
    } finally {
      setSavingName(false);
    }
  };

  const handleRequestPasswordChange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordFieldErrors({});

    if (newPassword.length < PASSWORD_MIN) {
      setPasswordFieldErrors((errors) => ({
        ...errors,
        new: t("profile.passwordMin", { min: PASSWORD_MIN })
      }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFieldErrors((errors) => ({ ...errors, confirm: t("profile.passwordMismatch") }));
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmPasswordChange = async () => {
    setSavingPassword(true);
    setPasswordError(null);
    try {
      await changeMyPassword(api, { currentPassword, newPassword });
      setConfirmOpen(false);
      endSession();
    } catch {
      setPasswordError(t("profile.toast.passwordError"));
      setSavingPassword(false);
    }
  };

  return (
    <section aria-labelledby="profile-title">
      <div className="page-header">
        <h1 className="page-title" id="profile-title">
          {t("profile.title")}
        </h1>
        <p className="page-description">
          {t("profile.subtitle")}
        </p>
      </div>

      <div className="profile-photo-section">
        <ProfilePhoto profile={profile} size="lg" />
        <div><strong>{profile.firstName} {profile.lastName}</strong><p className="page-description">{t("profile.photoHint")}</p></div>
      </div>

      <div className="detail-list" style={{ marginBottom: "var(--space-5)" }}>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("label.email")}</span>
          <span className="detail-list__value">{profile.email}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("label.status")}</span>
          <StatusBadge status={profile.status} />
        </div>
      </div>

      <form className="fieldset" onSubmit={(event) => void handleSaveName(event)}>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">{t("profile.section.personal")}</legend>
          {nameError ? <Alert variant="error">{nameError}</Alert> : null}
          <TextField
            label={t("label.firstName")}
            name="firstName"
            autoComplete="given-name"
            value={firstNameValue}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
          <TextField
            label={t("label.lastName")}
            name="lastName"
            autoComplete="family-name"
            value={lastNameValue}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
          <Button type="submit" icon={Save} disabled={!hasNameChanges} loading={savingName} loadingLabel={t("profile.saving")}>
            {t("profile.save")}
          </Button>
        </fieldset>
      </form>

      <form className="fieldset" style={{ marginTop: "var(--space-6)" }} onSubmit={handleRequestPasswordChange}>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">{t("profile.section.password")}</legend>
          <p className="page-description">
            {t("profile.passwordHint")}
          </p>
          {passwordError ? <Alert variant="error">{passwordError}</Alert> : null}
          <TextField
            label={t("profile.field.currentPassword")}
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            error={passwordFieldErrors.current}
            required
          />
          <TextField
            label={t("profile.field.newPassword")}
            type="password"
            name="newPassword"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            hint={t("profile.passwordMinHint", { min: PASSWORD_MIN })}
            error={passwordFieldErrors.new}
            required
          />
          <TextField
            label={t("profile.field.confirmPassword")}
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={passwordFieldErrors.confirm}
            required
          />
          <Button type="submit" icon={KeyRound}>{t("profile.requestChange")}</Button>
        </fieldset>
      </form>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t("profile.confirm.title")}
        description={t("profile.confirm.description")}
      >
        <div className="dialog-panel__actions">
          <Button
            variant="secondary"
            onClick={() => setConfirmOpen(false)}
            disabled={savingPassword}
          >
            {t("profile.confirm.cancel")}
          </Button>
          <Button
            variant="danger"
            loading={savingPassword}
            loadingLabel={t("profile.confirm.changing")}
            onClick={() => void handleConfirmPasswordChange()}
          >
            {t("profile.confirm.action")}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
