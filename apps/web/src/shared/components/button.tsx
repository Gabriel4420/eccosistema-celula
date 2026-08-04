import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly loading?: boolean;
  readonly loadingLabel?: string;
}

export function Button({
  variant = "primary",
  loading = false,
  loadingLabel,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const classes = ["button", `button--${variant}`];
  if (className) classes.push(className);

  return (
    <button
      className={classes.join(" ")}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className="spinner" aria-hidden="true" />
      ) : null}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
    </button>
  );
}

export type { ReactNode };
