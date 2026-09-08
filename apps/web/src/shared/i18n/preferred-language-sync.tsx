"use client";

import { useEffect, useRef } from "react";
import { getOwnPreferences } from "@/src/features/settings/api/settings-api";
import { useSession } from "@/src/providers/session-provider";
import { isAppLocale, useI18n } from "./language-provider";

export function PreferredLanguageSync() {
  const { status, api } = useSession();
  const { changeLanguage } = useI18n();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") {
      syncedRef.current = false;
      return undefined;
    }
    if (syncedRef.current) return undefined;
    syncedRef.current = true;
    let cancelled = false;

    void (async () => {
      try {
        const prefs = await getOwnPreferences(api);
        if (!cancelled && isAppLocale(prefs.language)) {
          changeLanguage(prefs.language);
        }
      } catch {
        // Keep the locally persisted language when preferences are unavailable.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, api, changeLanguage]);

  return null;
}
