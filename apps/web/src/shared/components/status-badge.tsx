interface StatusBadgeProps {
  readonly status: string;
  readonly activeLabel?: string;
  readonly inactiveLabel?: string;
}

export function StatusBadge({ status, activeLabel, inactiveLabel }: StatusBadgeProps) {
  const isActive = status === "ACTIVE";
  const variant = isActive ? "active" : status === "INACTIVE" ? "inactive" : "blocked";
  const label = isActive
    ? (activeLabel ?? "Ativo")
    : status === "INACTIVE"
      ? (inactiveLabel ?? "Inativo")
      : "Bloqueado";

  return (
    <span className={`status-badge status-badge--${variant}`}>{label}</span>
  );
}
