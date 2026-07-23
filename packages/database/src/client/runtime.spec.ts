import { assertRuntimeOperationAllowed } from "./runtime-policy";

describe("runtime database safety", () => {
  it("rejects physical deletion for soft-deletable models", () => {
    expect(() => assertRuntimeOperationAllowed("Church", "deleteMany")).toThrow(
      "Physical deletion is disabled"
    );
  });

  it("rejects mutations of audit records", () => {
    expect(() => assertRuntimeOperationAllowed("AuditLog", "update")).toThrow(
      "AuditLog is append-only"
    );
  });

  it("allows non-destructive operations", () => {
    expect(() => assertRuntimeOperationAllowed("Church", "findMany")).not.toThrow();
    expect(() => assertRuntimeOperationAllowed("AuditLog", "create")).not.toThrow();
  });
});
