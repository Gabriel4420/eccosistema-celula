"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/src/shared/components";
import { useSession } from "@/src/providers/session-provider";
import { useI18n } from "@/src/shared/i18n/language-provider";

export default function BootstrapEntry() {
  const { status } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  return (
    <div className="auth-shell">
      <div className="auth-card" aria-label={t("bootstrap.aria")}>
        <h1 className="auth-card__title">{t("bootstrap.loading")}</h1>
        <p className="auth-card__description">
          {t("bootstrap.verifying")}
        </p>
        <Skeleton width="100%" height="2.5rem" />
        <Skeleton width="100%" height="2.5rem" />
      </div>
    </div>
  );
}
