const ALLOWED_PREFIXES = ["/dashboard", "/profile", "/users", "/church", "/people"];

let pending: string | null = null;

export function setPendingDestination(path: string): void {
  if (isAllowedDestination(path)) pending = path;
}

export function consumePendingDestination(): string | null {
  const value = pending;
  pending = null;
  return value;
}

function isAllowedDestination(path: string): boolean {
  if (!path.startsWith("/")) return false;
  return ALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
