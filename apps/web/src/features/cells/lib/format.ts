import type {
  CellMeetingDay,
  CellStatus
} from "@/src/features/cells/api/cells-api";

const DAY_LABELS: Record<CellMeetingDay, string> = {
  MONDAY: "Segunda-feira",
  TUESDAY: "Terça-feira",
  WEDNESDAY: "Quarta-feira",
  THURSDAY: "Quinta-feira",
  FRIDAY: "Sexta-feira",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo"
};

const STATUS_LABELS: Record<CellStatus, string> = {
  FORMING: "Em formação",
  ACTIVE: "Ativa",
  SUSPENDED: "Suspensa",
  CLOSED: "Encerrada"
};

export function formatCellDay(day: CellMeetingDay): string {
  return DAY_LABELS[day];
}

export function formatCellStatus(status: CellStatus): string {
  return STATUS_LABELS[status];
}

export function formatCellTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
