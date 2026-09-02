import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "default" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly icon?: LucideIcon;
  readonly loading?: boolean;
  readonly loadingLabel?: string;
}

export function Button({
  variant = "primary",
  size = "default",
  icon: Icon,
  loading = false,
  loadingLabel,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const classes = ["button", `button--${variant}`];
  if (size === "sm") classes.push("button--sm");
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
      ) : Icon ? (
        <Icon aria-hidden="true" className="button__icon" />
      ) : null}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
    </button>
  );
}

export type { ReactNode };
