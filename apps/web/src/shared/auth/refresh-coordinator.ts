export const MIN_MARGIN_SECONDS = 10;
export const MAX_MARGIN_SECONDS = 60;

export function marginSeconds(expiresInSeconds: number): number {
  return Math.min(
    MAX_MARGIN_SECONDS,
    Math.max(MIN_MARGIN_SECONDS, expiresInSeconds * 0.1)
  );
}

export interface RefreshResult {
  readonly accessToken: string;
  readonly expiresAtMs: number;
}

interface RefreshCoordinatorOptions {
  readonly refresh: () => Promise<RefreshResult | null>;
  readonly onRefreshed: (result: RefreshResult) => void;
  readonly onExpired: () => void;
  readonly canRefresh?: () => boolean;
}

/**
 * Single-flight refresh coordinator. At most one refresh runs at a time,
 * the proactive timer fires once per installed session, and focus/visibility
 * recovery refreshes only when the token is inside the renewal margin.
 */
export class RefreshCoordinator {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private inflight: Promise<boolean> | null = null;
  private expiresAtMs: number | null = null;
  private expiresInSeconds: number | null = null;
  private disposed = false;

  constructor(private readonly options: RefreshCoordinatorOptions) {}

  install(expiresAtMs: number, expiresInSeconds: number): void {
    this.disposed = false;
    this.expiresAtMs = expiresAtMs;
    this.expiresInSeconds = expiresInSeconds;
    this.reschedule();
  }

  refresh(): Promise<boolean> {
    if (this.inflight) return this.inflight;
    this.inflight = this.run();
    return this.inflight;
  }

  refreshIfWithinMargin(): Promise<boolean> | null {
    if (this.expiresAtMs === null || this.expiresInSeconds === null) return null;
    const ttl = this.expiresAtMs - Date.now();
    if (ttl <= 0) return this.refresh();
    if (ttl <= marginSeconds(this.expiresInSeconds) * 1000) return this.refresh();
    return null;
  }

  reschedule(): void {
    this.clearTimer();
    if (this.expiresAtMs === null || this.expiresInSeconds === null) return;
    const ttl = this.expiresAtMs - Date.now();
    const delay = Math.max(0, ttl - marginSeconds(this.expiresInSeconds) * 1000);
    this.timer = setTimeout(() => {
      if (this.options.canRefresh?.() !== false) void this.refresh();
    }, delay);
  }

  dispose(): void {
    this.disposed = true;
    this.clearTimer();
    this.inflight = null;
    this.expiresAtMs = null;
    this.expiresInSeconds = null;
  }

  private async run(): Promise<boolean> {
    try {
      const result = await this.options.refresh();
      if (this.disposed) return false;
      if (!result) {
        this.options.onExpired();
        return false;
      }
      this.expiresAtMs = result.expiresAtMs;
      this.options.onRefreshed(result);
      this.reschedule();
      return true;
    } catch {
      // A timeout, offline browser or unavailable API does not revoke a session.
      if (!this.disposed) {
        this.clearTimer();
        this.timer = setTimeout(() => {
          if (this.options.canRefresh?.() !== false) void this.refresh();
        }, 30_000);
      }
      return false;
    } finally {
      this.inflight = null;
    }
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
