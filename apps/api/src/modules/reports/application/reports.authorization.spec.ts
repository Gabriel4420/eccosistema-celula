import { ReportsAuthorization } from "./reports.authorization";
import { ReportsError } from "./reports.error";
import { ReportsScopePolicy } from "../domain/reports.policy";
import type { AuthenticatedPrincipal } from "@mission-atos/domain";

function principal(roles: string[], userId = "user-1"): AuthenticatedPrincipal {
  return { userId, churchId: "church-1", sessionId: "session-1", roles };
}

function makeAuth() {
  return new ReportsAuthorization(new ReportsScopePolicy());
}

describe("ReportsAuthorization", () => {
  const authorization = makeAuth();

  it("resolves the church scope for ADMIN", () => {
    expect(authorization.resolveListScope(principal(["ADMIN"]))).toEqual({ kind: "church" });
  });

  it("throws AUTH_FORBIDDEN for roles without report access", () => {
    expect(() => authorization.resolveListScope(principal(["MEMBER"]))).toThrow(ReportsError);
    try {
      authorization.resolveListScope(principal(["MEMBER"]));
    } catch (error) {
      if (error instanceof ReportsError) {
        expect(error.code).toBe("AUTH_FORBIDDEN");
      } else {
        throw error;
      }
    }
  });
});