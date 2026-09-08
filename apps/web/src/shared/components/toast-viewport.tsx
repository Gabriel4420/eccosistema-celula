"use client";

import { CircleCheck, CircleX, Info, TriangleAlert, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSyncExternalStore } from "react";
import {
  dismissToast,
  getToasts,
  subscribeToasts
} from "@/src/shared/toast/toast-store";
import type { Toast, ToastKind } from "@/src/shared/toast/toast-store";
import { useI18n } from "@/src/shared/i18n/language-provider";

const ICONS: Record<ToastKind, LucideIcon> = {
  success: CircleCheck,
  error: CircleX,
  warning: TriangleAlert,
  info: Info
};

const EMPTY_TOASTS: readonly Toast[] = [];

export function ToastViewport() {
  const toasts = useSyncExternalStore(
    subscribeToasts,
    getToasts,
    () => EMPTY_TOASTS
  );
  const { t } = useI18n();
  if (toasts.length === 0) return null;
  return (
    <div
      className="toast-viewport"
      role="region"
      aria-label={t("toast.ariaNotifications")}
      aria-live="polite"
    >
      {toasts.map((item) => {
        const Icon = ICONS[item.kind];
        return (
          <div
            key={item.id}
            className={`toast toast--${item.kind}`}
            role="status"
          >
            <Icon className="toast__icon" aria-hidden="true" />
            <div className="toast__body">
              <p className="toast__title">{item.title}</p>
              {item.description ? (
                <p className="toast__description">{item.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="toast__close"
              onClick={() => dismissToast(item.id)}
              aria-label={t("toast.closeNotification")}
            >
              <X aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export type { Toast, ToastInput, ToastKind } from "@/src/shared/toast/toast-store";