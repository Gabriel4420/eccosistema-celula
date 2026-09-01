"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

interface DialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly description?: string;
  readonly children?: ReactNode;
  readonly labelledBy?: string;
  readonly className?: string;
  readonly hideHeader?: boolean;
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  hideHeader = false
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const panel = panelRef.current;
    if (!panel) return undefined;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = panel.querySelectorAll<HTMLElement>(focusableSelector);
    (focusables[0] ?? panel).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const list = Array.from(focusables);
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="dialog-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`dialog-panel${className ? ` ${className}` : ""}`}
      >
        {hideHeader ? (
          <h2 id={titleId} className="visually-hidden">
            {title}
          </h2>
        ) : (
          <div>
            <h2 id={titleId} className="dialog-panel__title">
              {title}
            </h2>
            {description ? (
              <p className="dialog-panel__description">{description}</p>
            ) : null}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
