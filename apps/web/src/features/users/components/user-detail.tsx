"use client";

import Link from "next/link";
import { Ban, KeyRound, Save, ShieldCheck, UserCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Button,
  Dialog,
  EmptyState,
  ErrorState,
  Skeleton,
  StatusBadge,
  TextField,
} from "@/src/shared/components";
import { ApiError } from "@/src/shared/api/api-error";
import { cacheStore } from "@/src/shared/cache/cache";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { toast } from "@/src/shared/toast/toast-store";
import {
  getManagedRoles,
  getUser,
  replaceUserRoles,
  resetUserPassword,
  updateUser,
  updateUserStatus,
} from "@/src/features/users/api/users-api";
import { roleLabel } from "@/src/shared/auth/session";
import { useI18n } from "@/src/shared/i18n/language-provider";

const PASSWORD_MIN = 12;
const USERS_CACHE = "users";
const ROLES_CACHE = "managedRoles";

type ConfirmAction = "none" | "status" | "roles" | "reset";

export function UserDetail() {
  const { api } = useSession();
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const {
    data: user,
    loading,
    error,
    reload,
  } = useRemoteQuery({
    fetcher: () => getUser(api, id),
    cacheName: USERS_CACHE,
    cacheKey: `detail:${id}`,
    ttlMs: 20_000,
  });

  const { data: managedRoles } = useRemoteQuery({
    fetcher: () => getManagedRoles(api),
    cacheName: ROLES_CACHE,
    cacheKey: "catalog",
    ttlMs: 60_000,
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[] | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>("none");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  if (loading && !user) {
    return (
      <div aria-label={t("users.detail.loading")}>
        <Skeleton width="40%" height="2.5rem" />
        <Skeleton width="100%" height="8rem" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <ErrorState
        title={t("users.error.load")}
        onRetry={() => void reload()}
      >
        {t("users.error.retry")}
      </ErrorState>
    );
  }

  if (!user) {
    return (
      <EmptyState title={t("users.detail.empty")}>
        {t("users.detail.empty.desc")}
      </EmptyState>
    );
  }

  const dirtyName = firstName !== "" && firstName !== user.firstName;
  const dirtyLastName = lastName !== "" && lastName !== user.lastName;
  const dirtyEmail = email !== "" && email !== user.email;
  const hasEdits = dirtyName || dirtyLastName || dirtyEmail;
  const currentRoleIds = selectedRoleIds ?? user.roles.map((role) => role.id);
  const roleDirty =
    selectedRoleIds !== null &&
    (currentRoleIds.length !== user.roles.length ||
      user.roles.some((role) => !currentRoleIds.includes(role.id)));

  const currentFirstName = firstName === "" ? user.firstName : firstName;
  const currentLastName = lastName === "" ? user.lastName : lastName;
  const currentEmail = email === "" ? user.email : email;

  const handleSaveEdits = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    const payload: Record<string, string> = {};
    if (dirtyName) payload.firstName = currentFirstName.trim();
    if (dirtyLastName) payload.lastName = currentLastName.trim();
    if (dirtyEmail) payload.email = currentEmail.trim();
    if (Object.keys(payload).length === 0) return;
    setBusy(true);
    try {
      await updateUser(api, id, payload);
      cacheStore(USERS_CACHE).invalidatePrefix("detail");
      cacheStore(USERS_CACHE).invalidatePrefix("page");
      await reload();
      setFirstName("");
      setLastName("");
      setEmail("");
      toast({
        kind: "success",
        title: t("users.toast.updated"),
        description: t("users.detail.toast.updated.desc")
      });
    } catch {
      setFeedback({
        kind: "error",
        message: t("users.detail.error.save"),
      });
    } finally {
      setBusy(false);
    }
  };

  const runConfirm = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      if (confirmAction === "status") {
        const next = user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
        await updateUserStatus(api, id, next);
        toast({
          kind: "success",
          title: next === "ACTIVE" ? t("users.detail.toast.activated") : t("users.detail.toast.blocked"),
          description: next === "ACTIVE" ? t("users.detail.toast.activated.desc") : t("users.detail.toast.blocked.desc")
        });
      } else if (confirmAction === "roles") {
        await replaceUserRoles(api, id, { roleIds: currentRoleIds });
        toast({
          kind: "success",
          title: t("users.detail.toast.roles"),
          description: t("users.detail.toast.roles.desc")
        });
      } else if (confirmAction === "reset") {
        await resetUserPassword(api, id, resetPassword);
        setResetPassword("");
        toast({
          kind: "success",
          title: t("users.detail.toast.password"),
          description: t("users.detail.toast.password.desc")
        });
      }
      cacheStore(USERS_CACHE).invalidatePrefix("detail");
      cacheStore(USERS_CACHE).invalidatePrefix("page");
      await reload();
      setConfirmAction("none");
    } catch (cause) {
      const message =
        cause instanceof ApiError && cause.code === "LAST_ACTIVE_ADMIN"
          ? t("users.detail.error.lastAdmin")
          : cause instanceof ApiError && cause.code === "USER_EMAIL_CONFLICT"
            ? t("users.detail.error.emailConflict")
            : t("users.detail.error.generic");
      setFeedback({ kind: "error", message });
    } finally {
      setBusy(false);
    }
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((selection) => {
      const current = selection ?? user.roles.map((role) => role.id);
      return current.includes(roleId)
        ? current.filter((item) => item !== roleId)
        : [...current, roleId];
    });
  };

  const confirmTitle =
    confirmAction === "status"
      ? user.status === "ACTIVE"
        ? t("users.detail.dialog.block.title")
        : t("users.detail.dialog.activate.title")
      : confirmAction === "roles"
        ? t("users.detail.dialog.roles.title")
        : t("users.detail.dialog.reset.title");

  const confirmDescription =
    confirmAction === "status"
      ? user.status === "ACTIVE"
        ? t("users.detail.dialog.block.desc")
        : t("users.detail.dialog.activate.desc")
      : confirmAction === "roles"
        ? t("users.detail.dialog.roles.desc")
        : t("users.detail.dialog.reset.desc");

  return (
    <section aria-labelledby="user-title">
      <div className="page-header flex-col">
        <h1 className="page-title" id="user-title">
          {user.firstName} {user.lastName}
        </h1>
        <Link className="breadcrumbs__link" href="/users">
          {t("users.detail.back")}
        </Link>
      </div>

      {feedback ? (
        <Alert
          variant={feedback.kind}
          title={feedback.kind === "success" ? t("common.success") : t("common.failure")}
        >
          {feedback.message}
        </Alert>
      ) : null}

      <div className="detail-list" style={{ marginBottom: "var(--space-5)" }}>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("label.email")}</span>
          <span className="detail-list__value">{user.email}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("common.status")}</span>
          <StatusBadge status={user.status} />
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">{t("users.detail.roles.legend")}</span>
          <span className="detail-list__value">
            {user.roles.map((role) => roleLabel(role.name, t)).join(", ")}
          </span>
        </div>
      </div>

      <form
        className="fieldset"
        onSubmit={(event) => void handleSaveEdits(event)}
      >
        <fieldset className="fieldset">
          <legend className="fieldset__legend">{t("users.detail.edit")}</legend>
          <TextField
            label={t("label.firstName")}
            name="firstName"
            value={currentFirstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
          <TextField
            label={t("label.lastName")}
            name="lastName"
            value={currentLastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
          <TextField
            label={t("label.email")}
            type="email"
            name="email"
            mask="email"
            value={currentEmail}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Button
            type="submit"
            icon={Save}
            disabled={!hasEdits}
            loading={busy}
            loadingLabel={t("common.saving")}
          >
            {t("users.detail.saveChanges")}
          </Button>
        </fieldset>
      </form>

      <form
        className="fieldset"
        style={{ marginTop: "var(--space-6)" }}
        onSubmit={(event) => {
          event.preventDefault();
          if (roleDirty) setConfirmAction("roles");
        }}
      >
        <fieldset className="fieldset">
          <legend className="fieldset__legend">{t("users.detail.roles.legend")}</legend>
          <p className="page-description">{t("users.detail.roles.hint")}</p>
          {(managedRoles ?? []).map((role) => {
            const isSelected = currentRoleIds.includes(role.id);
            return (
              <label
                key={role.id}
                className="field__label"
                style={{
                  display: "flex",
                  gap: "var(--space-2)",
                  alignItems: "center",
                  fontWeight: 500,
                }}
              >
                <input
                  type="checkbox"
                  name="roleIds"
                  value={role.id}
                  checked={isSelected}
                  onChange={() => toggleRole(role.id)}
                />
                {roleLabel(role.name, t)}
              </label>
            );
          })}
          <Button type="submit" icon={ShieldCheck} disabled={!roleDirty} variant="secondary">
            {t("users.detail.saveRoles")}
          </Button>
        </fieldset>
      </form>

      <div className="toolbar" style={{ marginTop: "var(--space-6)" }}>
        {user.status === "ACTIVE" ? (
          <Button variant="danger" icon={Ban} onClick={() => setConfirmAction("status")}>
            {t("users.detail.blockUser")}
          </Button>
        ) : (
          <Button
            variant="secondary"
            icon={UserCheck}
            onClick={() => setConfirmAction("status")}
          >
            {t("users.detail.activateUser")}
          </Button>
        )}
        <Button variant="secondary" icon={KeyRound} onClick={() => setConfirmAction("reset")}>
          {t("users.detail.resetPassword")}
        </Button>
      </div>

      <Dialog
        open={confirmAction !== "none"}
        onClose={() => setConfirmAction("none")}
        title={confirmTitle}
        description={confirmDescription}
      >
        {confirmAction === "reset" ? (
          <TextField
            label={t("users.detail.dialog.newPassword")}
            type="password"
            name="newPassword"
            autoComplete="new-password"
            value={resetPassword}
            onChange={(event) => setResetPassword(event.target.value)}
            hint={t("users.detail.dialog.passwordHint", { min: PASSWORD_MIN })}
            required
          />
        ) : null}
        <div className="dialog-panel__actions">
          <Button
            variant="secondary"
            onClick={() => setConfirmAction("none")}
            disabled={busy}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant={
              confirmAction === "status" && user.status === "ACTIVE"
                ? "danger"
                : "primary"
            }
            disabled={
              confirmAction === "reset" && resetPassword.length < PASSWORD_MIN
            }
            loading={busy}
            loadingLabel={t("users.detail.dialog.confirming")}
            onClick={() => void runConfirm()}
          >
            {t("common.confirm")}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
