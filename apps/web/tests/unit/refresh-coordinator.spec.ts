import {
  marginSeconds,
  MAX_MARGIN_SECONDS,
  MIN_MARGIN_SECONDS,
  RefreshCoordinator
} from "@/src/shared/auth/refresh-coordinator";

describe("marginSeconds", () => {
  it("clamps to the configured bounds", () => {
    expect(marginSeconds(30)).toBe(MIN_MARGIN_SECONDS);
    expect(marginSeconds(600)).toBe(MAX_MARGIN_SECONDS);
    expect(marginSeconds(400)).toBe(40);
  });
});

describe("RefreshCoordinator", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("schedules a single proactive refresh inside the renewal margin", async () => {
    const now = 1_000_000;
    jest.setSystemTime(now);
    const refresh = jest
      .fn()
      .mockResolvedValue({ accessToken: "new", expiresAtMs: now + 600_000 });
    const onRefreshed = jest.fn();
    const onExpired = jest.fn();
    const coordinator = new RefreshCoordinator({ refresh, onRefreshed, onExpired });

    coordinator.install(now + 600_000, 600);

    jest.advanceTimersByTime(539_000);
    expect(refresh).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1_000);
    expect(refresh).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    expect(onRefreshed).toHaveBeenCalledTimes(1);
    expect(onExpired).not.toHaveBeenCalled();
    coordinator.dispose();
  });

  it("does not renew in the background and recovers when the user returns", async () => {
    const refresh = jest.fn(async () => ({ accessToken: "new", expiresAtMs: Date.now() + 600_000 }));
    const onExpired = jest.fn();
    const coordinator = new RefreshCoordinator({ refresh, onRefreshed: jest.fn(), onExpired, canRefresh: () => false });
    coordinator.install(Date.now() + 600_000, 600);
    await jest.advanceTimersByTimeAsync(2 * 24 * 60 * 60 * 1000);
    expect(refresh).not.toHaveBeenCalled();
    expect(onExpired).not.toHaveBeenCalled();
    await coordinator.refreshIfWithinMargin();
    expect(refresh).toHaveBeenCalledTimes(1);
    coordinator.dispose();
  });

  it("ends the session only when the server rejects refresh", async () => {
    const onExpired = jest.fn();
    const coordinator = new RefreshCoordinator({ refresh: async () => null, onRefreshed: jest.fn(), onExpired });
    await coordinator.refresh();
    expect(onExpired).toHaveBeenCalledTimes(1);
    coordinator.dispose();
  });

  it("deduplicates concurrent refreshes with a single flight", async () => {
    let resolveRefresh: ((value: unknown) => void) | undefined;
    const refresh = jest
      .fn()
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRefresh = resolve;
          })
      );
    const coordinator = new RefreshCoordinator({
      refresh,
      onRefreshed: jest.fn(),
      onExpired: jest.fn()
    });

    const first = coordinator.refresh();
    const second = coordinator.refresh();
    expect(refresh).toHaveBeenCalledTimes(1);

    resolveRefresh?.({ accessToken: "a", expiresAtMs: 1 });
    await first;
    await second;
    expect(refresh).toHaveBeenCalledTimes(1);
    coordinator.dispose();
  });

  it("refreshes immediately when already inside the margin", async () => {
    const now = 1_000_000;
    jest.setSystemTime(now);
    const refresh = jest
      .fn()
      .mockResolvedValue({ accessToken: "b", expiresAtMs: now + 60_000 });
    const coordinator = new RefreshCoordinator({
      refresh,
      onRefreshed: jest.fn(),
      onExpired: jest.fn()
    });

    coordinator.install(now + 30_000, 600);
    const pending = coordinator.refreshIfWithinMargin();
    expect(pending).not.toBeNull();
    await pending!;
    expect(refresh).toHaveBeenCalledTimes(1);
    coordinator.dispose();
  });

  it("does not refresh when outside the margin", () => {
    const now = 1_000_000;
    jest.setSystemTime(now);
    const refresh = jest.fn();
    const coordinator = new RefreshCoordinator({
      refresh,
      onRefreshed: jest.fn(),
      onExpired: jest.fn()
    });

    coordinator.install(now + 120_000, 600);
    expect(coordinator.refreshIfWithinMargin()).toBeNull();
    expect(refresh).not.toHaveBeenCalled();
    coordinator.dispose();
  });

  it("renews an expired access token instead of ending the session", async () => {
    const now = 1_000_000;
    jest.setSystemTime(now);
    const onExpired = jest.fn();
    const coordinator = new RefreshCoordinator({
      refresh: jest.fn().mockResolvedValue({ accessToken: "renewed", expiresAtMs: now + 600_000 }),
      onRefreshed: jest.fn(),
      onExpired
    });

    coordinator.install(now - 1, 600);
    await jest.advanceTimersByTimeAsync(0);
    expect(onExpired).not.toHaveBeenCalled();
    coordinator.dispose();
  });

  it("preserves the session when the network temporarily fails", async () => {
    const onExpired = jest.fn();
    const coordinator = new RefreshCoordinator({
      refresh: async () => {
        throw new TypeError("Failed to fetch");
      },
      onRefreshed: jest.fn(),
      onExpired
    });

    await expect(coordinator.refresh()).resolves.toBe(false);
    expect(onExpired).not.toHaveBeenCalled();
    coordinator.dispose();
  });
});


describe("successive renewals", () => {
  it("uses each new expiration when scheduling the next renewal", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(1_000_000);
    const refresh = jest.fn(async () => ({ accessToken: "new", expiresAtMs: Date.now() + 600_000 }));
    const onExpired = jest.fn();
    const coordinator = new RefreshCoordinator({ refresh, onRefreshed: jest.fn(), onExpired });
    coordinator.install(Date.now() + 600_000, 600);
    await jest.advanceTimersByTimeAsync(540_000);
    expect(refresh).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(540_000);
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(onExpired).not.toHaveBeenCalled();
    coordinator.dispose();
    jest.useRealTimers();
  });
});
