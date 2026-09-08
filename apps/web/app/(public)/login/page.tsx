"use client";

import { loginRequestSchema } from "@mission-atos/contracts";
import Image from "next/image";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toApiError } from "@/src/shared/api/api-error";
import { Alert, Button, TextField } from "@/src/shared/components";
import { Skeleton } from "@/src/shared/components";
import { consumePendingDestination } from "@/src/shared/navigation/pending-destination";
import { useSession } from "@/src/providers/session-provider";
import { toast } from "@/src/shared/toast/toast-store";
import { useI18n } from "@/src/shared/i18n/language-provider";

export default function LoginPage() {
  const { status, login } = useSession();
  const router = useRouter();
  const { t } = useI18n();
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
        <div className="auth-card" aria-label={t("common.loading")}>
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
        if (issue.path[0] === "email") errors.email = t("login.invalidEmail");
        if (issue.path[0] === "password") errors.password = t("login.requiredPassword");
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
      let message: string;
      if (apiError.status === 401) {
        message = t("login.invalidCredentials");
      } else if (apiError.status === 429) {
        message = t("login.rateLimited");
      } else {
        message = t("login.genericError");
      }
      setFormError(message);
      toast({
        kind: "error",
        title: t("login.toastTitle"),
        description: message
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-showcase" aria-label={t("login.presentationAria")}>
        <Image
          className="auth-showcase__logo"
          src="/brand/missao-atos-logo.png"
          alt={t("login.brandAlt")}
          width={1254}
          height={1254}
          priority
        />
        <div className="auth-showcase__message">
          <p>{t("app.tagline")}</p>
          <h2>{t("app.tagline.sub")}</h2>
          <span>{t("app.tagline.description")}</span>
        </div>
      </aside>
      <div className="auth-card">
        <div className="auth-card__brand">
          <span className="auth-card__brand-mark" aria-hidden="true">EC</span>
        </div>
        <p className="auth-card__eyebrow">{t("login.title")}</p>
        <h1 className="auth-card__title">{t("app.title")}</h1>
        <p className="auth-card__description">{t("login.subtitle")}</p>
        {formError ? <Alert variant="error" title={t("login.alertTitle")}>{formError}</Alert> : null}
        <form className="fieldset" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <TextField
            label={t("login.emailLabel")}
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
            label={t("login.passwordLabel")}
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            required
          />
          <Button type="submit" icon={LogIn} loading={submitting} loadingLabel={t("login.submitting")}>
            {t("login.submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
