import type { ApiClient } from "@/src/shared/api/api-client";
import { updateMyProfilePhoto } from "@/src/features/profile/api/profile-api";

describe("profile API", () => {
  it("removes the local preview before issuing the profile photo PUT", async () => {
    const request = jest.fn().mockResolvedValue({
      data: {
        id: "00000000-0000-4000-8000-000000000001",
        firstName: "Ana",
        lastName: "Silva",
        email: "ana@example.com",
        status: "ACTIVE",
        hasProfilePhoto: true,
        profilePhotoUpdatedAt: "2026-08-31T15:00:00.000Z",
        roles: [],
        createdAt: "2026-08-31T12:00:00.000Z",
        updatedAt: "2026-08-31T15:00:00.000Z"
      },
      meta: {}
    });
    const api = { request } as unknown as ApiClient;
    const candidate = {
      preview: "blob:https://example.test/local-preview",
      contentType: "image/jpeg" as const,
      base64: "/9j/AA=="
    };

    await updateMyProfilePhoto(api, candidate);

    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      method: "PUT",
      path: "/users/me/profile-photo",
      body: { contentType: "image/jpeg", base64: "/9j/AA==" }
    }));
    expect(request.mock.calls[0]?.[0].body).not.toHaveProperty("preview");
  });
});
