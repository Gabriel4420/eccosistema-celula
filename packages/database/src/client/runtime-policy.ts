const softDeletableModels = new Set([
  "Church",
  "User",
  "Role",
  "UserRole",
  "SupervisorAssignment",
  "Cell",
  "Person",
  "CellMembership",
  "Meeting",
  "MeetingAttendance",
  "MeetingReport"
]);

const physicalDeleteOperations = new Set(["delete", "deleteMany"]);
const auditMutationOperations = new Set([
  "update",
  "updateMany",
  "delete",
  "deleteMany"
]);

export function assertRuntimeOperationAllowed(
  model: string,
  operation: string
): void {
  if (
    softDeletableModels.has(model) &&
    physicalDeleteOperations.has(operation)
  ) {
    throw new Error(
      `Physical deletion is disabled for soft-deletable model ${model}`
    );
  }

  if (model === "AuditLog" && auditMutationOperations.has(operation)) {
    throw new Error("AuditLog is append-only through the runtime client");
  }

  if (model === "Session" && physicalDeleteOperations.has(operation)) {
    throw new Error("Session history cannot be physically deleted at runtime");
  }
}
