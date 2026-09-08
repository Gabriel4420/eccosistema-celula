"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useI18n } from "@/src/shared/i18n/language-provider";

interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  readonly width?: string;
  readonly height?: string;
}

export function Skeleton({ width = "100%", height = "1rem", className, ...props }: SkeletonProps) {
  return (
    <span
      className={`skeleton ${className ?? ""}`}
      style={{ width, height }}
      aria-hidden="true"
      {...props}
    />
  );
}

export function EmptyState({
  title,
  children,
}: {
  readonly title: string;
  readonly children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

export function ErrorState({
  title,
  children,
  onRetry,
  retryLabel,
}: {
  readonly title: string;
  readonly children?: ReactNode;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
}) {
  const { t } = useI18n();
  const label = retryLabel ?? t("states.retry");
  return (
    <div className="error-state" role="alert">
      <p className="error-state__title">{title}</p>
      {children ? <p>{children}</p> : null}
      {onRetry ? (
        <button type="button" className="button button--secondary" onClick={onRetry}>
          {label}
        </button>
      ) : null}
    </div>
  );
}