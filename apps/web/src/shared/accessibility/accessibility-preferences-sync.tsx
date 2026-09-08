"use client";

import { useEffect } from "react";
import { getOwnPreferences } from "@/src/features/settings/api/settings-api";
import { useSession } from "@/src/providers/session-provider";
import { applyAccessibilityPreferences } from "./accessibility-preferences";

export function AccessibilityPreferencesSync() {
  const { api, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    void getOwnPreferences(api).then((preferences) => {
      if (!cancelled) applyAccessibilityPreferences(preferences);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, status]);

  return null;
}
