import type { ReactNode } from "react";

type AlertVariant = "error" | "success" | "warning" | "info";

interface AlertProps {
  readonly variant: AlertVariant;
  readonly title?: string;
  readonly children?: ReactNode;
  readonly id?: string;
  readonly live?: boolean;
}

export function Alert({ variant, title, children, id, live = true }: AlertProps) {
  return (
    <div
      id={id}
      className={`alert alert--${variant}`}
      role={live ? (variant === "error" ? "alert" : "status") : undefined}
    >
      <div>
        {title ? <p className="alert__title">{title}</p> : null}
        {children ? <p>{children}</p> : null}
      </div>
    </div>
  );
}

export function FieldError({ id, children }: { readonly id?: string; readonly children: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="field__error" role="alert">
      {children}
    </p>
  );
}
