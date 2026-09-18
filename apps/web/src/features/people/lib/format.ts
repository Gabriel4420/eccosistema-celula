const NON_DIGITS = /\D/g;
const EMPTY_PHONE = "—";

export function formatPhone(value: string | null | undefined): string {
  if (value === null || value === undefined) return EMPTY_PHONE;

  const raw = value.trim();
  if (raw.length === 0) return EMPTY_PHONE;

  const digits = raw.replace(NON_DIGITS, "");
  const hasCountryCode = digits.startsWith("55") && digits.length > 11;
  const local = hasCountryCode ? digits.slice(2) : digits;

  if (local.length !== 10 && local.length !== 11) return raw;

  const ddd = local.slice(0, 2);
  const number = local.slice(2);
  const mobile = local.length === 11;

  return `(+55) ${ddd} ${mobile ? number.slice(0, 5) : number.slice(0, 4)}-${mobile ? number.slice(5) : number.slice(4)}`;
}