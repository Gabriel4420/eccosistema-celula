"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/src/shared/components";
import { useSession } from "@/src/providers/session-provider";

export default function BootstrapEntry() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  return (
    <div className="auth-shell">
      <div className="auth-card" aria-label="Carregando sessão">
        <h1 className="auth-card__title">Ecossistema de Células</h1>
        <p className="auth-card__description">
          Verificando sua sessão…
        </p>
        <Skeleton width="100%" height="2.5rem" />
        <Skeleton width="100%" height="2.5rem" />
      </div>
    </div>
  );
}
