import type { ReactNode } from "react";
import { cn } from "./cn";

export function DescriptionList({
  children,
  className
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return <dl className={cn("divide-y divide-border", className)}>{children}</dl>;
}

export function DescriptionItem({
  label,
  value,
  className
}: {
  readonly label: ReactNode;
  readonly value: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-1 px-4 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4",
        className
      )}
    >
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm font-medium text-foreground [overflow-wrap:anywhere]">
        {value}
      </dd>
    </div>
  );
}