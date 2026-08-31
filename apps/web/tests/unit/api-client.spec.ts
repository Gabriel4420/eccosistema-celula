import { z } from "zod";
import { ApiClient } from "@/src/shared/api/api-client";
import type { RefreshTokenPayload } from "@/src/shared/api/api-client";

const idEnvelopeSchema = z
  .object({ data: z.object({ id: z.string() }), meta: z.object({}).strict() })
  .strict();

function response(status: number, body: unknown) {
  return {
    status,
    text: async () => (body === undefined ? "" : JSON.stringify(body))
  } as Response;
}

function client(overrides: {
  refreshRequest?: () => Promise<RefreshTokenPayload | null>;
  onSessionEnded?: () => void;
} = {}) {
  return new ApiClient({
    baseUrl: "http://api.example",
    refreshRequest: overrides.refreshRequest,
    onSessionEnded: overrides.onSessionEnded ?? jest.fn(),
    timeoutMs: 5_000
  });
}

describe("ApiClient", () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("sends the bearer token and parses envelope data", async () => {
    fetchMock.mockResolvedValue(
      response(200, { data: { id: "1" }, meta: {} })
    );
    const api = client();
    api.setAccessToken("token", 600);

    const result = await api.request({
      method: "GET",
      path: "/users/me",
      bearer: true,
      schema: idEnvelopeSchema
    });

    expect(result).toEqual({ data: { id: "1" }, meta: {} });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.authorization).toBe("Bearer token");
    expect(init.credentials).toBe("include");
    expect(init.cache).toBe("no-store");
    api.clearAccessToken();
  });

  it("refreshes once and retries after a private 401", async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(401, {
          error: { code: "AUTH_UNAUTHENTICATED", message: "x", details: {} }
        })
      )
      .mockResolvedValueOnce(
        response(200, { data: { id: "2" }, meta: {} })
      );
    const refreshRequest = jest
      .fn()
      .mockResolvedValue({ accessToken: "refreshed", expiresIn: 600 });
    const api = client({ refreshRequest });
    api.setAccessToken("token", 600);

    const result = await api.request({
      method: "GET",
      path: "/users",
      bearer: true,
      schema: idEnvelopeSchema
    });

    expect(result).toEqual({ data: { id: "2" }, meta: {} });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(refreshRequest).toHaveBeenCalledTimes(1);
    const [, retryInit] = fetchMock.mock.calls[1];
    expect(retryInit.headers.authorization).toBe("Bearer refreshed");
    api.clearAccessToken();
  });

  it("ends the session when a 401 refresh fails", async () => {
    fetchMock.mockResolvedValue(
      response(401, {
        error: { code: "AUTH_UNAUTHENTICATED", message: "x", details: {} }
      })
    );
    const onSessionEnded = jest.fn();
    const api = client({ refreshRequest: async () => null, onSessionEnded });
    api.setAccessToken("token", 600);

    await expect(
      api.request({ method: "GET", path: "/users", bearer: true, schema: idEnvelopeSchema })
    ).rejects.toMatchObject({ code: "AUTH_UNAUTHENTICATED" });
    expect(onSessionEnded).toHaveBeenCalledTimes(1);
    api.clearAccessToken();
  });

  it("ends the session when a 401 refresh request throws", async () => {
    fetchMock.mockResolvedValue(
      response(401, {
        error: { code: "AUTH_UNAUTHENTICATED", message: "x", details: {} }
      })
    );
    const onSessionEnded = jest.fn();
    const api = client({
      refreshRequest: async () => {
        throw new TypeError("Failed to fetch");
      },
      onSessionEnded
    });
    api.setAccessToken("token", 600);

    await expect(
      api.request({ method: "GET", path: "/users", bearer: true, schema: idEnvelopeSchema })
    ).rejects.toMatchObject({ code: "AUTH_UNAUTHENTICATED" });
    expect(onSessionEnded).toHaveBeenCalledTimes(1);
    api.clearAccessToken();
  });

  it("retries transient network errors once for queries", async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(response(200, { data: { id: "1" }, meta: {} }));
    const api = client();
    api.setAccessToken("token", 600);

    const result = await api.request({
      method: "GET",
      path: "/people",
      bearer: true,
      schema: idEnvelopeSchema,
      allowRetry: true
    });

    expect(result).toEqual({ data: { id: "1" }, meta: {} });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    api.clearAccessToken();
  });

  it("never retries transient errors for mutations", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const api = client();
    api.setAccessToken("token", 600);

    await expect(
      api.request({ method: "POST", path: "/people", body: { fullName: "A" }, bearer: true, schema: idEnvelopeSchema })
    ).rejects.toMatchObject({ code: "NETWORK_ERROR" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    api.clearAccessToken();
  });

  it("surfaces server conflict codes without internal details", async () => {
    fetchMock.mockResolvedValue(
      response(409, {
        error: { code: "PERSON_DUPLICATE", message: "Conflict", details: {} }
      })
    );
    const api = client();
    api.setAccessToken("token", 600);

    await expect(
      api.request({ method: "POST", path: "/people", body: { fullName: "A" }, bearer: true, schema: idEnvelopeSchema })
    ).rejects.toMatchObject({ code: "PERSON_DUPLICATE", status: 409 });
    api.clearAccessToken();
  });

  it("rejects unexpected response formats as integration errors", async () => {
    fetchMock.mockResolvedValue(response(200, { unexpected: true }));
    const api = client();
    api.setAccessToken("token", 600);

    await expect(
      api.request({ method: "GET", path: "/users/me", bearer: true, schema: idEnvelopeSchema })
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
    api.clearAccessToken();
  });

  it("throws when no token is available for a private request", async () => {
    const onSessionEnded = jest.fn();
    const api = client({ onSessionEnded });

    await expect(
      api.request({ method: "GET", path: "/users", bearer: true, schema: idEnvelopeSchema })
    ).rejects.toMatchObject({ code: "AUTH_UNAUTHENTICATED" });
    expect(onSessionEnded).toHaveBeenCalledTimes(1);
  });
});
