import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { AuthError } from "../domain/auth-error";

interface Counter {
  count: number;
  resetsAt: number;
}

@Injectable()
export class LoginRateLimiter {
  private readonly counters = new Map<string, Counter>();
  private readonly windowMs = 15 * 60 * 1000;

  assertAllowed(ip: string, normalizedEmail: string, now = Date.now()): void {
    this.consume(`ip:${ip}`, 10, now);
    const accountKey = createHash("sha256")
      .update(normalizedEmail)
      .digest("hex");
    this.consume(`account:${accountKey}`, 5, now);
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
