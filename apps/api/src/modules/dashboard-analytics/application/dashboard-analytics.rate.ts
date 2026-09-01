export function aggregateAttendanceRate(
  presentSum: number,
  eligibleSum: number
): number | null {
  if (eligibleSum <= 0) return null;
  const capped = Math.min(presentSum, eligibleSum);
  return roundPercentage(capped / eligibleSum);
}

function roundPercentage(ratio: number): number {
  return Math.round(ratio * 10_000) / 100;
}
