import type { ApiClient } from "@/src/shared/api/api-client";
import { importFile } from "@/src/features/bulk-import/api/bulk-import-api";

const uploadFile = jest.fn();
const api = { uploadFile } as unknown as ApiClient;

describe("bulk-import-api", () => {
  beforeEach(() => uploadFile.mockReset());

  it("uploads the file to the selected domain without enabling mutation retry", async () => {
    const file = new File(["fullName\nMaria"], "people.csv", { type: "text/csv" });
    uploadFile.mockResolvedValue({
      data: {
        domain: "people",
        fileName: "people.csv",
        format: "csv",
        processed: 1,
        created: 1,
        failed: 0,
        resultsPerRow: [{ row: 1, status: "created" }]
      },
      meta: {}
    });

    await expect(importFile(api, "people", file)).resolves.toMatchObject({ created: 1 });
    expect(uploadFile).toHaveBeenCalledWith(expect.objectContaining({
      path: "/import/people",
      file,
      bearer: true,
      timeoutMs: 600_000
    }));
    expect(uploadFile.mock.calls[0][0]).not.toHaveProperty("allowRetry", true);
  });
});
