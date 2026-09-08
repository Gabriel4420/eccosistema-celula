"use client";

import { parseWebPublicEnvironment } from "@mission-atos/config/public";
import type { AuthResponse } from "@mission-atos/contracts";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import type { ReactNode } from "react";
import { ApiClient } from "@/src/shared/api/api-client";
import type { ApiError } from "@/src/shared/api/api-error";
import { capabilitiesFor } from "@/src/shared/auth/capabilities";
import type { Capabilities } from "@/src/shared/auth/capabilities";
import type { SessionPrincipal, SessionStatus } from "@/src/shared/auth/session";
import { toast } from "@/src/shared/toast/toast-store";
import { clearAllCaches } from "@/src/shared/cache/cache";
import { postLogin, postLogout, postRefresh } from "@/src/features/auth/api/auth-api";
import { useI18n } from "@/src/shared/i18n/language-provider";
import type { TranslationKey } from "@/src/shared/i18n/dictionaries";
import type { TranslationParams } from "@/src/shared/i18n/dictionaries";

interface SessionContextValue {
  readonly status: SessionStatus;
  readonly principal: SessionPrincipal | null;
  readonly capabilities: Capabilities;
  readonly api: ApiClient;
  readonly login: (email: string, password: string) => Promise<void>;
  readonly logout: () => Promise<void>;
  readonly endSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { readonly children: ReactNode }) {
  const router = useRouter();
  const { t } = useI18n();
  const [status, setStatus] = useState<SessionStatus>("bootstrapping");
  const [principal, setPrincipal] = useState<SessionPrincipal | null>(null);

  const baseUrl = useMemo(
    () => {
      if (process.env.NODE_ENV === "production") return "/api";
      const configured = parseWebPublicEnvironment({
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
      }).NEXT_PUBLIC_API_URL;
      return configured;
    },
    []
  );

  const handleApiError = useCallback((error: ApiError) => {
    notifyApiError(error, t);
  }, [t]);

  const [api] = useState(
    () =>
      new ApiClient({
        baseUrl,
        timeoutMs: 15_000,
        onSessionEnded: () => {
          /* replaced by setSessionEndedHandler */
        },
        onError: handleApiError,
        refreshRequest: async () => {
          const auth = await postRefresh(baseUrl);
          return auth
            ? { accessToken: auth.data.accessToken, expiresIn: auth.data.expiresIn }
            : null;
        }
      })
  );

  useEffect(() => {
    api.setErrorHandler(handleApiError);
  }, [api, handleApiError]);

  const endSession = useCallback(() => {
    api.clearAccessToken();
    clearAllCaches();
    setPrincipal(null);
    setStatus("anonymous");
    router.replace("/login");
  }, [api, router]);

  useEffect(() => {
    api.setSessionEndedHandler(endSession);
  }, [api, endSession]);

  const installAuth = useCallback(
    (auth: AuthResponse) => {
      api.setAccessToken(auth.data.accessToken, auth.data.expiresIn);
      setPrincipal({
        userId: auth.data.user.id,
        churchId: auth.data.user.churchId,
        roles: auth.data.user.roles
      });
      setStatus("authenticated");
    },
    [api]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      let auth: AuthResponse | null = null;
      try {
        auth = await postRefresh(baseUrl);
      } catch {
        auth = null;
      }
      if (cancelled) return;
      if (auth) {
        installAuth(auth);
      } else {
        setStatus("anonymous");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [baseUrl, installAuth]);

  useEffect(() => {
    if (status !== "authenticated") return undefined;
    const recover = () => {
      const pending = api.refreshIfWithinMargin();
      if (pending) void pending;
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") recover();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", recover);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", recover);
    };
  }, [status, api]);

  const login = useCallback(
    async (email: string, password: string) => {
      const auth = await postLogin(baseUrl, { email, password });
      installAuth(auth);
    },
    [baseUrl, installAuth]
  );

  const logout = useCallback(async () => {
    setStatus("ending");
    try {
      await postLogout(baseUrl);
    } finally {
      api.clearAccessToken();
      clearAllCaches();
      setPrincipal(null);
      setStatus("anonymous");
      router.replace("/login");
    }
  }, [baseUrl, api, router]);

  const capabilities = useMemo(() => capabilitiesFor(principal), [principal]);

  const value = useMemo<SessionContextValue>(
    () => ({ status, principal, capabilities, api, login, logout, endSession }),
    [status, principal, capabilities, api, login, logout, endSession]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

function notifyApiError(error: ApiError, t: (key: TranslationKey, params?: TranslationParams) => string): void {
  if (error.code === "TIMEOUT") {
    toast({
      kind: "error",
      title: t("api.timeout"),
      description: t("api.network")
    });
    return;
  }
  if (error.code === "NETWORK_ERROR") {
    toast({
      kind: "error",
      title: t("api.network"),
      description: t("api.generic")
    });
    return;
  }
  toast({
    kind: "error",
    title: t("api.generic"),
    description: error.message || t("api.generic")
  });
}
