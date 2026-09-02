export type ToastKind = "success" | "error" | "warning" | "info";

export interface ToastInput {
  readonly kind?: ToastKind;
  readonly title: string;
  readonly description?: string;
  readonly durationMs?: number;
}

export interface Toast extends ToastInput {
  readonly id: number;
  readonly kind: ToastKind;
}

const DEFAULT_DURATION_MS = 4_000;
const ERROR_DURATION_MS = 6_000;
const MAX_TOASTS = 4;

type Listener = (toasts: readonly Toast[]) => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();
let nextId = 1;

export function toast(input: ToastInput): number {
  const kind: ToastKind = input.kind ?? "info";
  const id = nextId++;
  toasts = [...toasts.slice(-(MAX_TOASTS - 1)), { ...input, id, kind }];
  emit();
  const durationMs =
    input.durationMs ?? (kind === "error" ? ERROR_DURATION_MS : DEFAULT_DURATION_MS);
  window.setTimeout(() => dismissToast(id), durationMs);
  return id;
}

export function dismissToast(id: number): void {
  const next = toasts.filter((item) => item.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}

export function getToasts(): readonly Toast[] {
  return toasts;
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(): void {
  for (const listener of listeners) listener(toasts);
}