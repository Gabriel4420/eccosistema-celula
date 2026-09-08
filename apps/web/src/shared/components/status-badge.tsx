"use client";

import { useI18n } from "@/src/shared/i18n/language-provider";

interface StatusBadgeProps {
  readonly status: string;
  readonly activeLabel?: string;
  readonly inactiveLabel?: string;
}

export function StatusBadge({ status, activeLabel, inactiveLabel }: StatusBadgeProps) {
  const { t } = useI18n();
  const isActive = status === "ACTIVE";
  const variant = isActive ? "active" : status === "INACTIVE" ? "inactive" : "blocked";
  const label = isActive
    ? (activeLabel ?? t("statusBadge.active"))
    : status === "INACTIVE"
      ? (inactiveLabel ?? t("statusBadge.inactive"))
      : t("statusBadge.blocked");

  return (
    <span className={`status-badge status-badge--${variant}`}>{label}</span>
  );
}