import { postRefresh } from "@/src/features/auth/api/auth-api";
import { httpRequest } from "@/src/shared/api/http-client";

jest.mock("@/src/shared/api/http-client", () => ({ httpRequest: jest.fn() }));
const request = jest.mocked(httpRequest);

const auth = {
  data: {
    accessToken: "access", tokenType: "Bearer", expiresIn: 600,
    user: { id: "11111111-1111-4111-8111-111111111111", churchId: "22222222-2222-4222-8222-222222222222", roles: [] }
  }, meta: {}
};

describe("refresh transport", () => {
  it("shares the bootstrap request between simultaneous consumers", async () => {
    request.mockResolvedValueOnce({ status: 200, data: auth });
    const first = postRefresh("/api");
    const second = postRefresh("/api");
    expect(first).toBe(second);
    await expect(first).resolves.toEqual(auth);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("returns no session only when authentication is rejected", async () => {
    request.mockResolvedValueOnce({ status: 401, data: {} });
    await expect(postRefresh("/api")).resolves.toBeNull();
  });

  it.each([429, 500, 503])("does not treat HTTP %s as logout", async (status) => {
    request.mockResolvedValueOnce({ status, data: {} });
    await expect(postRefresh("/api")).rejects.toMatchObject({ status });
  });
});
