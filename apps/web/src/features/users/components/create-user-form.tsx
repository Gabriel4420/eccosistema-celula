"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Alert, Button, EmptyState, ErrorState, Skeleton, TextField } from "@/src/shared/components";
import { ApiError } from "@/src/shared/api/api-error";
import { cacheStore } from "@/src/shared/cache/cache";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { toast } from "@/src/shared/toast/toast-store";
import { createUser, getManagedRoles } from "@/src/features/users/api/users-api";
import { roleLabel } from "@/src/shared/auth/session";
import { useI18n } from "@/src/shared/i18n/language-provider";
import { evaluatePasswordStrength } from "@mission-atos/contracts";
import { PasswordStrengthMeter } from "./password-strength-meter";

const USERS_CACHE = "users";
const ROLES_CACHE = "managedRoles";

export function CreateUserForm() {
  const { api } = useSession();
  const { t } = useI18n();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [initialPassword, setInitialPassword] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: managedRoles, loading, error, reload } = useRemoteQuery({
    fetcher: () => getManagedRoles(api),
    cacheName: ROLES_CACHE,
    cacheKey: "catalog",
    ttlMs: 60_000
  });

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((current) =>
      current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId]
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    if (selectedRoleIds.length === 0) {
      setFieldErrors((errors) => ({ ...errors, roles: t("users.new.error.roles") }));
      return;
    }
    if (!evaluatePasswordStrength(initialPassword).isValid) {
      setFieldErrors((errors) => ({
        ...errors,
        initialPassword: t("users.new.error.password")
      }));
      return;
    }
    setSubmitting(true);
    try {
      const user = await createUser(api, {
        firstName,
        lastName,
        email,
        initialPassword,
        roleIds: selectedRoleIds
      });
      cacheStore(USERS_CACHE).invalidatePrefix("page");
      toast({
        kind: "success",
        title: t("users.toast.created"),
        description: t("users.new.toast.created.desc", {
          name: `${user.firstName} ${user.lastName}`
        })
      });
      router.push(`/users/${user.id}`);
    } catch (cause) {
      const message =
        cause instanceof ApiError && cause.code === "USER_EMAIL_CONFLICT"
          ? t("users.new.error.emailConflict")
          : t("users.new.error.generic");
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !managedRoles) {
    return (
      <div aria-label={t("users.loading.roles")}>
        <Skeleton width="100%" height="8rem" />
      </div>
    );
  }

  if (error && !managedRoles) {
    return (
      <ErrorState title={t("users.error.loadRoles")} onRetry={() => void reload()}>
        {t("users.error.retry")}
      </ErrorState>
    );
  }

  return (
    <section aria-labelledby="new-user-title">
      <div className="page-header">
        <h1 className="page-title" id="new-user-title">
          {t("users.new.title")}
        </h1>
        <Link className="breadcrumbs__link" href="/users">
          {t("users.detail.back")}
        </Link>
      </div>

      {formError ? (
        <Alert variant="error" title={t("users.new.alertTitle")}>
          {formError}
        </Alert>
      ) : null}

      <form className="fieldset" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">{t("users.new.legend.access")}</legend>
          <TextField
            label={t("label.firstName")}
            name="firstName"
            autoComplete="off"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            error={fieldErrors.firstName}
            required
          />
          <TextField
            label={t("label.lastName")}
            name="lastName"
            autoComplete="off"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            error={fieldErrors.lastName}
            required
          />
          <TextField
            label={t("label.email")}
            type="email"
            name="email"
            mask="email"
            autoComplete="off"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
            required
          />
          <TextField
            label={t("users.new.field.password")}
            type="password"
            name="initialPassword"
            autoComplete="new-password"
            value={initialPassword}
            onChange={(event) => setInitialPassword(event.target.value)}
            hint={t("users.new.hint.password")}
            error={fieldErrors.initialPassword}
            required
          />
          <PasswordStrengthMeter password={initialPassword} />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset__legend">{t("users.new.legend.roles")}</legend>
          {fieldErrors.roles ? <Alert variant="error">{fieldErrors.roles}</Alert> : null}
          {(managedRoles ?? []).length === 0 ? (
            <EmptyState title={t("users.new.noRoles")}>
              {t("users.new.noRoles.desc")}
            </EmptyState>
          ) : (
            <div className="fieldset">
              {(managedRoles ?? []).map((role) => (
                <label key={role.id} className="field__label" style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    name="roleIds"
                    value={role.id}
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                  />
                  {roleLabel(role.name, t)}
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <div className="dialog-panel__actions" style={{ justifyContent: "flex-start", marginTop: "var(--space-4)" }}>
          <Button type="submit" icon={UserPlus} loading={submitting} loadingLabel={t("users.new.submitting")}>
            {t("users.new.submit")}
          </Button>
          <Link className="button button--secondary" href="/users">
            {t("common.cancel")}
          </Link>
        </div>
      </form>
    </section>
  );
}
