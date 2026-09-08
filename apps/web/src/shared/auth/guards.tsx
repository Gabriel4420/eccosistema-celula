"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { Skeleton } from "@/src/shared/components";
import type { Capabilities } from "@/src/shared/auth/capabilities";
import { setPendingDestination } from "@/src/shared/navigation/pending-destination";
import { useSession } from "@/src/providers/session-provider";
import { useI18n } from "@/src/shared/i18n/language-provider";

export function RequireSession({ children }: { readonly children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();

  useEffect(() => {
    if (status === "anonymous") {
      setPendingDestination(pathname);
      router.replace("/login");
    }
  }, [status, pathname, router]);

  if (status === "bootstrapping") {
    return (
      <div className="auth-shell" aria-label={t("shell.loadingSession")}>
        <div className="auth-card">
          <Skeleton width="60%" height="1.5rem" />
          <Skeleton width="100%" height="2.5rem" />
          <Skeleton width="100%" height="2.5rem" />
          <Skeleton width="100%" height="2.5rem" />
        </div>
      </div>
    );
  }

  if (status !== "authenticated") return null;

  return <>{children}</>;
}

export function RequireRole({
  allow,
  children
}: {
  readonly allow: readonly string[];
  readonly children: ReactNode;
}) {
  const { principal } = useSession();
  const router = useRouter();
  const allowed = Boolean(
    principal && principal.roles.some((role) => allow.includes(role))
  );

  useEffect(() => {
    if (principal && !allowed) router.replace("/access-denied");
  }, [principal, allowed, router]);

  if (!allowed) return null;

  return <>{children}</>;
}

export function Can({
  capability,
  children,
  fallback = null
}: {
  readonly capability: keyof Capabilities;
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}) {
  const { capabilities } = useSession();
  return capabilities[capability] ? <>{children}</> : <>{fallback}</>;
}
