import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { AuthError } from "../domain/auth-error";

interface Counter {
  count: number;
  resetsAt: number;
}

export interface LoginRateLimits {
  readonly ip: number;
  readonly account: number;
}

@Injectable()
export class LoginRateLimiter {
  private readonly counters = new Map<string, Counter>();
  private readonly windowMs = 15 * 60 * 1000;

  constructor(
    private readonly limits: LoginRateLimits = { ip: 10, account: 5 }
  ) {}

  assertAllowed(ip: string, normalizedEmail: string, now = Date.now()): void {
    this.consume(`ip:${ip}`, this.limits.ip, now);
    const accountKey = createHash("sha256")
      .update(normalizedEmail)
      .digest("hex");
    this.consume(`account:${accountKey}`, this.limits.account, now);
  }

  private consume(key: string, limit: number, now: number): void {
    const current = this.counters.get(key);
    const counter =
      !current || current.resetsAt <= now
        ? { count: 0, resetsAt: now + this.windowMs }
        : current;
    counter.count += 1;
    this.counters.set(key, counter);
    if (counter.count > limit) {
      throw new AuthError(
        "AUTH_RATE_LIMITED",
        "Too many login attempts"
      );
    }
  }
}
