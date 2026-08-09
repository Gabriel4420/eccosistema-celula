"use client";

import { loginRequestSchema } from "@mission-atos/contracts";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toApiError } from "@/src/shared/api/api-error";
import { Alert, Button, TextField } from "@/src/shared/components";
import { Skeleton } from "@/src/shared/components";
import { consumePendingDestination } from "@/src/shared/navigation/pending-destination";
import { useSession } from "@/src/providers/session-provider";

const GENERIC_LOGIN_ERROR = "Não foi possível entrar. Tente novamente.";

export default function LoginPage() {
  const { status, login } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [destination] = useState(
    () => consumePendingDestination() ?? "/dashboard"
  );

  useEffect(() => {
    if (status === "authenticated") router.replace(destination);
  }, [status, router, destination]);

  if (status === "bootstrapping") {
    return (
      <div className="auth-shell">
        <div className="auth-card" aria-label="Carregando">
          <Skeleton width="70%" height="2rem" />
          <Skeleton width="100%" height="2.5rem" />
          <Skeleton width="100%" height="2.5rem" />
        </div>
      </div>
    );
  }

  if (status === "authenticated") return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = loginRequestSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errors: { email?: string; password?: string } = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "email") errors.email = "Informe um e-mail válido.";
        if (issue.path[0] === "password") errors.password = "Informe sua senha.";
      }
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      router.replace(destination);
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.status === 401) {
        setFormError("E-mail ou senha inválidos.");
      } else if (apiError.status === 429) {
        setFormError("Muitas tentativas. Aguarde um momento e tente novamente.");
      } else {
        setFormError(GENERIC_LOGIN_ERROR);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-card__title">Ecossistema de Células</h1>
        <p className="auth-card__description">Entre com sua conta para continuar.</p>
        {formError ? <Alert variant="error" title="Não foi possível entrar">{formError}</Alert> : null}
        <form className="fieldset" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <TextField
            label="E-mail"
            type="email"
            name="email"
            mask="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
            required
          />
          <TextField
            label="Senha"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            required
          />
          <Button type="submit" loading={submitting} loadingLabel="Entrando…">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
