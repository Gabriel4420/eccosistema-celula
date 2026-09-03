import {
  importResultEnvelopeSchema,
  type ImportDomain,
  type ImportResult
} from "@mission-atos/contracts";
import type { ApiClient } from "@/src/shared/api/api-client";

export async function importFile(
  api: ApiClient,
  domain: ImportDomain,
  file: File
): Promise<ImportResult> {
  const envelope = await api.uploadFile({
    path: `/import/${domain}`,
    file,
    bearer: true,
    schema: importResultEnvelopeSchema,
    timeoutMs: 600_000
  });
  return envelope.data;
}
