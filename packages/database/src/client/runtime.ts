import { Prisma } from "../generated/prisma/client.js";
import { createAdminClient } from "./admin.js";
import { assertRuntimeOperationAllowed } from "./runtime-policy.js";

export const runtimeSafetyExtension = Prisma.defineExtension({
  name: "runtime-safety",
  query: {
    $allModels: {
      $allOperations({ model, operation, args, query }) {
        assertRuntimeOperationAllowed(model, operation);
        return query(args);
      }
    }
  }
});

export function createRuntimeClient(
  environment: Readonly<Record<string, string | undefined>> = process.env
) {
  return createAdminClient(environment).$extends(runtimeSafetyExtension);
}

export type RuntimeDatabaseClient = ReturnType<typeof createRuntimeClient>;
