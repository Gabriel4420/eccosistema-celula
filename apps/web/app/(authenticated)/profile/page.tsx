"use client";

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
  TextField
} from "@/src/shared/components";
import { cacheStore } from "@/src/shared/cache/cache";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import {
  changeMyPassword,
  getMyProfile,
  updateMyProfile
} from "@/src/features/profile/api/profile-api";
import { ProfilePhoto } from "@/src/features/profile/components/profile-photo";

const PASSWORD_MIN = 12;
const PROFILE_CACHE = "profile";

export default function ProfilePage() {
  const { api, endSession } = useSession();
  const { data: profile, loading, error, reload } = useRemoteQuery({
    fetcher: () => getMyProfile(api),
    cacheName: PROFILE_CACHE,
    cacheKey: "me",
    ttlMs: 15_000
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameSaved, setNameSaved] = useState(false);
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
      <div aria-label="Carregando perfil">
        <Skeleton width="40%" height="2.5rem" />
        <Skeleton width="100%" height="8rem" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <ErrorState title="Não foi possível carregar seu perfil" onRetry={() => void reload()}>
        Tente novamente em instantes.
      </ErrorState>
    );
  }

  if (!profile) {
    return <EmptyState title="Perfil indisponível">Seus dados não puderam ser carregados.</EmptyState>;
  }

  const firstNameValue = firstName === "" ? profile.firstName : firstName;
  const lastNameValue = lastName === "" ? profile.lastName : lastName;
  const hasNameChanges =
    (firstName !== "" && firstName !== profile.firstName) ||
    (lastName !== "" && lastName !== profile.lastName);

  const handleSaveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNameError(null);
    setNameSaved(false);
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
      setNameSaved(true);
    } catch {
      setNameError("Não foi possível salvar suas alterações. Tente novamente.");
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
        new: `A nova senha deve ter ao menos ${PASSWORD_MIN} caracteres.`
      }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFieldErrors((errors) => ({ ...errors, confirm: "As senhas não coincidem." }));
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
      setPasswordError(
        "Não foi possível alterar a senha. Verifique a senha atual e tente novamente."
      );
      setSavingPassword(false);
    }
  };

  return (
    <section aria-labelledby="profile-title">
      <div className="page-header">
        <h1 className="page-title" id="profile-title">
          Meu perfil
        </h1>
        <p className="page-description">
          Mantenha seus dados pessoais atualizados. E-mail e acesso são
          controlados por um administrador.
        </p>
      </div>

      {nameSaved ? (
        <Alert variant="success" title="Perfil atualizado">
          Seus dados foram salvos.
        </Alert>
      ) : null}

      <div className="profile-photo-section">
        <ProfilePhoto profile={profile} size="lg" />
        <div><strong>{profile.firstName} {profile.lastName}</strong><p className="page-description">Clique na foto para alterar.</p></div>
      </div>

      <div className="detail-list" style={{ marginBottom: "var(--space-5)" }}>
        <div className="detail-list__item">
          <span className="detail-list__label">E-mail</span>
          <span className="detail-list__value">{profile.email}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Status</span>
          <StatusBadge status={profile.status} />
        </div>
      </div>

      <form className="fieldset" onSubmit={(event) => void handleSaveName(event)}>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">Dados pessoais</legend>
          {nameError ? <Alert variant="error">{nameError}</Alert> : null}
          <TextField
            label="Nome"
            name="firstName"
            autoComplete="given-name"
            value={firstNameValue}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
          <TextField
            label="Sobrenome"
            name="lastName"
            autoComplete="family-name"
            value={lastNameValue}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
          <Button type="submit" disabled={!hasNameChanges} loading={savingName} loadingLabel="Salvando…">
            Salvar alterações
          </Button>
        </fieldset>
      </form>

      <form className="fieldset" style={{ marginTop: "var(--space-6)" }} onSubmit={handleRequestPasswordChange}>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">Alterar senha</legend>
          <p className="page-description">
            Após confirmar, sua sessão será encerrada e você deverá entrar novamente.
          </p>
          {passwordError ? <Alert variant="error">{passwordError}</Alert> : null}
          <TextField
            label="Senha atual"
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            error={passwordFieldErrors.current}
            required
          />
          <TextField
            label="Nova senha"
            type="password"
            name="newPassword"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            hint={`Ao menos ${PASSWORD_MIN} caracteres.`}
            error={passwordFieldErrors.new}
            required
          />
          <TextField
            label="Confirmar nova senha"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={passwordFieldErrors.confirm}
            required
          />
          <Button type="submit">Solicitar alteração de senha</Button>
        </fieldset>
      </form>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirmar alteração de senha"
        description="Sua senha será alterada e todas as suas sessões serão encerradas. Você precisará entrar novamente."
      >
        <div className="dialog-panel__actions">
          <Button
            variant="secondary"
            onClick={() => setConfirmOpen(false)}
            disabled={savingPassword}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            loading={savingPassword}
            loadingLabel="Alterando…"
            onClick={() => void handleConfirmPasswordChange()}
          >
            Confirmar alteração
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
