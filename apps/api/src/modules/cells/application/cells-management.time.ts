export function formatTime(value: Date): string {
  return value.toISOString().slice(11, 16);
}

export function parseTime(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}
