let lastWarmAt = 0;
const WARM_INTERVAL_MS = 60_000;
const WARM_TIMEOUT_MS = 2_000;

function tryWarm(url: string, timeoutMs: number): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, {
    method: "GET",
    credentials: "omit",
    cache: "no-store",
    mode: "cors",
    signal: controller.signal
  })
    .catch(() => undefined)
    .finally(() => clearTimeout(timeout));
}

export function warmApi(baseUrl: string): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastWarmAt < WARM_INTERVAL_MS) return;
  lastWarmAt = now;

  const normalizedBase = baseUrl.replace(/\/$/, "");
  const candidates = [
    `${normalizedBase}/health`,
    `${normalizedBase}/healthz`,
    `${normalizedBase}/`,
    `${normalizedBase}/auth/health`
  ];

  for (const url of candidates) {
    void tryWarm(url, WARM_TIMEOUT_MS);
  }
}
