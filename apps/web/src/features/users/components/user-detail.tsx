"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Alert, Button, Dialog, EmptyState, ErrorState, Skeleton, StatusBadge, TextField } from "@/src/shared/components";
import { ApiError } from "@/src/shared/api/api-error";
import { cacheStore } from "@/src/shared/cache/cache";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { getManagedRoles, getUser, replaceUserRoles, resetUserPassword, updateUser, updateUserStatus } from "@/src/features/users/api/users-api";

const PASSWORD_MIN = 12;
const USERS_CACHE = "users";
const ROLES_CACHE = "managedRoles";

type ConfirmAction = "none" | "status" | "roles" | "reset";

export function UserDetail() {
  const { api } = useSession();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: user, loading, error, reload } = useRemoteQuery({
    fetcher: () => getUser(api, id),
    cacheName: USERS_CACHE,
    cacheKey: `detail:${id}`,
    ttlMs: 20_000
  });

  const { data: managedRoles } = useRemoteQuery({
    fetcher: () => getManagedRoles(api),
    cacheName: ROLES_CACHE,
    cacheKey: "catalog",
    ttlMs: 60_000
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[] | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>("none");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  if (loading && !user) {
    return (
      <div aria-label="Carregando usuário">
        <Skeleton width="40%" height="2.5rem" />
        <Skeleton width="100%" height="8rem" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <ErrorState title="Não foi possível carregar o usuário" onRetry={() => void reload()}>
        Tente novamente em instantes.
      </ErrorState>
    );
  }

  if (!user) {
    return <EmptyState title="Usuário não encontrado">O usuário solicitado não existe.</EmptyState>;
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
      setFeedback({ kind: "success", message: "Usuário atualizado." });
    } catch {
      setFeedback({ kind: "error", message: "Não foi possível salvar as alterações. Verifique os dados e tente novamente." });
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
        setFeedback({ kind: "success", message: next === "ACTIVE" ? "Usuário ativado." : "Usuário bloqueado." });
      } else if (confirmAction === "roles") {
        await replaceUserRoles(api, id, { roleIds: currentRoleIds });
        setFeedback({ kind: "success", message: "Papéis atualizados." });
      } else if (confirmAction === "reset") {
        await resetUserPassword(api, id, resetPassword);
        setResetPassword("");
        setFeedback({ kind: "success", message: "Senha redefinida. Compartilhe a nova senha com o usuário em um canal seguro." });
      }
      cacheStore(USERS_CACHE).invalidatePrefix("detail");
      cacheStore(USERS_CACHE).invalidatePrefix("page");
      await reload();
      setConfirmAction("none");
    } catch (cause) {
      const message =
        cause instanceof ApiError && cause.code === "LAST_ACTIVE_ADMIN"
          ? "Não é possível concluir a operação porque este é o último administrador ativo da igreja."
          : cause instanceof ApiError && cause.code === "USER_EMAIL_CONFLICT"
            ? "Já existe um usuário com este e-mail."
            : "Não foi possível concluir a operação. O servidor pode ter recusado por segurança.";
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
        ? "Bloquear usuário"
        : "Ativar usuário"
      : confirmAction === "roles"
        ? "Substituir papéis"
        : "Redefinir senha";

  const confirmDescription =
    confirmAction === "status"
      ? user.status === "ACTIVE"
        ? "O usuário não conseguirá mais entrar enquanto estiver bloqueado."
        : "O usuário voltará a conseguir entrar."
      : confirmAction === "roles"
        ? "Os papéis atuais serão substituídos pelos selecionados. Confirme antes de continuar."
        : "A senha atual será substituída imediatamente.";

  return (
    <section aria-labelledby="user-title">
      <div className="page-header">
        <h1 className="page-title" id="user-title">
          {user.firstName} {user.lastName}
        </h1>
        <Link className="breadcrumbs__link" href="/users">
          Voltar para usuários
        </Link>
      </div>

      {feedback ? (
        <Alert variant={feedback.kind} title={feedback.kind === "success" ? "Sucesso" : "Falha"}>
          {feedback.message}
        </Alert>
      ) : null}

      <div className="detail-list" style={{ marginBottom: "var(--space-5)" }}>
        <div className="detail-list__item">
          <span className="detail-list__label">E-mail</span>
          <span className="detail-list__value">{user.email}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Status</span>
          <StatusBadge status={user.status} />
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Papéis</span>
          <span className="detail-list__value">{user.roles.map((role) => role.name).join(", ")}</span>
        </div>
      </div>

      <form className="fieldset" onSubmit={(event) => void handleSaveEdits(event)}>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">Editar dados</legend>
          <TextField
            label="Nome"
            name="firstName"
            value={currentFirstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
          <TextField
            label="Sobrenome"
            name="lastName"
            value={currentLastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
          <TextField
            label="E-mail"
            type="email"
            name="email"
            value={currentEmail}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Button type="submit" disabled={!hasEdits} loading={busy} loadingLabel="Salvando…">
            Salvar alterações
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
          <legend className="fieldset__legend">Papéis</legend>
          <p className="page-description">A alteração exige confirmação e pode afetar permissões.</p>
          {(managedRoles ?? []).map((role) => {
            const isSelected = currentRoleIds.includes(role.id);
            return (
              <label key={role.id} className="field__label" style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", fontWeight: 500 }}>
                <input
                  type="checkbox"
                  name="roleIds"
                  value={role.id}
                  checked={isSelected}
                  onChange={() => toggleRole(role.id)}
                />
                {role.name}
              </label>
            );
          })}
          <Button type="submit" disabled={!roleDirty} variant="secondary">
            Salvar papéis
          </Button>
        </fieldset>
      </form>

      <div className="toolbar" style={{ marginTop: "var(--space-6)" }}>
        {user.status === "ACTIVE" ? (
          <Button variant="danger" onClick={() => setConfirmAction("status")}>
            Bloquear usuário
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => setConfirmAction("status")}>
            Ativar usuário
          </Button>
        )}
        <Button variant="secondary" onClick={() => setConfirmAction("reset")}>
          Redefinir senha
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
            label="Nova senha"
            type="password"
            name="newPassword"
            autoComplete="new-password"
            value={resetPassword}
            onChange={(event) => setResetPassword(event.target.value)}
            hint={`Ao menos ${PASSWORD_MIN} caracteres.`}
            required
          />
        ) : null}
        <div className="dialog-panel__actions">
          <Button variant="secondary" onClick={() => setConfirmAction("none")} disabled={busy}>
            Cancelar
          </Button>
          <Button
            variant={confirmAction === "status" && user.status === "ACTIVE" ? "danger" : "primary"}
            disabled={confirmAction === "reset" && resetPassword.length < PASSWORD_MIN}
            loading={busy}
            loadingLabel="Confirmando…"
            onClick={() => void runConfirm()}
          >
            Confirmar
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
