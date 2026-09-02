import {
  dismissToast,
  getToasts,
  subscribeToasts,
  toast
} from "@/src/shared/toast/toast-store";

describe("toast store", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    for (const item of getToasts()) dismissToast(item.id);
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("pushes toasts and notifies subscribers", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToasts(listener);

    toast({ kind: "success", title: "Salvo", description: "Ok." });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(getToasts()).toHaveLength(1);
    expect(getToasts()[0]).toMatchObject({ kind: "success", title: "Salvo", description: "Ok." });

    unsubscribe();
  });

  it("defaults the kind to info", () => {
    const id = toast({ title: "Aviso" });
    expect(getToasts().find((item) => item.id === id)?.kind).toBe("info");
  });

  it("caps the visible stack and dismisses a specific toast", () => {
    for (let index = 0; index < 5; index += 1) {
      toast({ kind: "info", title: `T${index}` });
    }
    const titles = getToasts().map((item) => item.title);
    expect(titles).toEqual(["T1", "T2", "T3", "T4"]);

    const first = getToasts()[0];
    if (first) dismissToast(first.id);
    expect(getToasts()).toHaveLength(3);
  });

  it("auto-dismisses after the default duration", () => {
    jest.useFakeTimers();
    toast({ kind: "success", title: "Salvo" });
    expect(getToasts()).toHaveLength(1);

    jest.advanceTimersByTime(4_000);
    expect(getToasts()).toHaveLength(0);
  });

  it("keeps error toasts on screen longer", () => {
    jest.useFakeTimers();
    toast({ kind: "error", title: "Falhou" });
    expect(getToasts()).toHaveLength(1);

    jest.advanceTimersByTime(4_000);
    expect(getToasts()).toHaveLength(1);

    jest.advanceTimersByTime(2_000);
    expect(getToasts()).toHaveLength(0);
  });
});