const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;
const BR_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function formatDateBR(value: string | Date | null | undefined): string {
  if (typeof value === "string" && value) {
    const match = ISO_DATE.exec(value);
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
    return "";
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${value.getFullYear()}`;
  }
  return "";
}

export function parseDateBR(value: string): string {
  const match = BR_DATE.exec(value);
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function isValidDateBR(value: string): boolean {
  const match = BR_DATE.exec(value);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (day < 1 || month < 1 || month > 12) return false;
  return day <= lastDayOfMonth(year, month);
}

function lastDayOfMonth(year: number, month: number): number {
  switch (month) {
    case 2:
      return isLeapYear(year) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}