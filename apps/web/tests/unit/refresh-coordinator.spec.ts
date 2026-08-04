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

  it("ends the session when the token is already expired", () => {
    const now = 1_000_000;
    jest.setSystemTime(now);
    const onExpired = jest.fn();
    const coordinator = new RefreshCoordinator({
      refresh: jest.fn(),
      onRefreshed: jest.fn(),
      onExpired
    });

    coordinator.install(now - 1, 600);
    expect(onExpired).toHaveBeenCalledTimes(1);
    coordinator.dispose();
  });

  it("ends the session when refresh throws", async () => {
    const onExpired = jest.fn();
    const coordinator = new RefreshCoordinator({
      refresh: async () => {
        throw new TypeError("Failed to fetch");
      },
      onRefreshed: jest.fn(),
      onExpired
    });

    await expect(coordinator.refresh()).resolves.toBe(false);
    expect(onExpired).toHaveBeenCalledTimes(1);
    coordinator.dispose();
  });
});
