import type { CellStatus } from "./enums";

export const cellCodePattern = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
export const cellCodeMinLength = 1;
export const cellCodeMaxLength = 50;
export const cellNameMaxLength = 160;
export const cellAddressMaxLength = 500;

const writableCellStatuses = ["ACTIVE", "SUSPENDED"] as const;

export function normalizeCellText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeCellCode(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidCellCode(value: string): boolean {
  return (
    value.length >= cellCodeMinLength &&
    value.length <= cellCodeMaxLength &&
    cellCodePattern.test(value)
  );
}

export function isWritableCellStatus(status: CellStatus): boolean {
  return (writableCellStatuses as readonly CellStatus[]).includes(status);
}

export function canTransitionCellStatus(from: CellStatus, to: CellStatus): boolean {
  if (from === to) {
    return true;
  }
  if (from === "CLOSED") {
    return to === "ACTIVE";
  }
  return isWritableCellStatus(to);
}

export function requiresLeader(status: CellStatus): boolean {
  return status === "ACTIVE";
}

export function hasConflictingLeadership(
  leaderId: string | null,
  traineeLeaderId: string | null
): boolean {
  return leaderId !== null && leaderId === traineeLeaderId;
}
