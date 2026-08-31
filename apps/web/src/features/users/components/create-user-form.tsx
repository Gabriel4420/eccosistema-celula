"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Alert, Button, EmptyState, ErrorState, Skeleton, TextField } from "@/src/shared/components";
import { ApiError } from "@/src/shared/api/api-error";
import { cacheStore } from "@/src/shared/cache/cache";
import { useRemoteQuery } from "@/src/shared/hooks/use-remote-query";
import { useSession } from "@/src/providers/session-provider";
import { createUser, getManagedRoles } from "@/src/features/users/api/users-api";
import { evaluatePasswordStrength } from "@mission-atos/contracts";
import { PasswordStrengthMeter } from "./password-strength-meter";

const USERS_CACHE = "users";
const ROLES_CACHE = "managedRoles";

export function CreateUserForm() {
  const { api } = useSession();
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
      setFieldErrors((errors) => ({ ...errors, roles: "Selecione ao menos um papel." }));
      return;
    }
    if (!evaluatePasswordStrength(initialPassword).isValid) {
      setFieldErrors((errors) => ({
        ...errors,
        initialPassword: "Use uma senha que cumpra todos os requisitos de segurança."
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
      router.push(`/users/${user.id}`);
    } catch (cause) {
      const message =
        cause instanceof ApiError && cause.code === "USER_EMAIL_CONFLICT"
          ? "Já existe um usuário com este e-mail."
          : "Não foi possível criar o usuário. Verifique os dados e tente novamente.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !managedRoles) {
    return (
      <div aria-label="Carregando papéis">
        <Skeleton width="100%" height="8rem" />
      </div>
    );
  }

  if (error && !managedRoles) {
    return (
      <ErrorState title="Não foi possível carregar os papéis" onRetry={() => void reload()}>
        Tente novamente em instantes.
      </ErrorState>
    );
  }

  return (
    <section aria-labelledby="new-user-title">
      <div className="page-header">
        <h1 className="page-title" id="new-user-title">
          Novo usuário
        </h1>
        <Link className="breadcrumbs__link" href="/users">
          Voltar para usuários
        </Link>
      </div>

      {formError ? (
        <Alert variant="error" title="Não foi possível criar">
          {formError}
        </Alert>
      ) : null}

      <form className="fieldset" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <fieldset className="fieldset">
          <legend className="fieldset__legend">Dados de acesso</legend>
          <TextField
            label="Nome"
            name="firstName"
            autoComplete="off"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            error={fieldErrors.firstName}
            required
          />
          <TextField
            label="Sobrenome"
            name="lastName"
            autoComplete="off"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            error={fieldErrors.lastName}
            required
          />
          <TextField
            label="E-mail"
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
            label="Senha inicial"
            type="password"
            name="initialPassword"
            autoComplete="new-password"
            value={initialPassword}
            onChange={(event) => setInitialPassword(event.target.value)}
            hint="Compartilhe a senha inicial com o usuário por um canal seguro."
            error={fieldErrors.initialPassword}
            required
          />
          <PasswordStrengthMeter password={initialPassword} />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset__legend">Papéis</legend>
          {fieldErrors.roles ? <Alert variant="error">{fieldErrors.roles}</Alert> : null}
          {(managedRoles ?? []).length === 0 ? (
            <EmptyState title="Nenhum papel disponível">
              Não há papéis gerenciáveis para atribuir.
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
                  {role.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <div className="dialog-panel__actions" style={{ justifyContent: "flex-start", marginTop: "var(--space-4)" }}>
          <Button type="submit" loading={submitting} loadingLabel="Criando…">
            Criar usuário
          </Button>
          <Link className="button button--secondary" href="/users">
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}
