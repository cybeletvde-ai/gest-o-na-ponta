import { useSyncExternalStore } from "react";
import type { Kind } from "@/lib/finance/types";

// Controla o menu do + de qualquer tela (ex: botão "Vender" abre direto a Entrada preenchida).
export type EntradaPrefill = { amount: number; description: string };
type State = { open: boolean; mode: Kind | null; prefill: EntradaPrefill | null; key: number };

let state: State = { open: false, mode: null, prefill: null, key: 0 };
const listeners = new Set<() => void>();
const emit = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

export const quickActions = {
  open: () => emit({ open: true, mode: null, prefill: null, key: state.key + 1 }),
  sell: (prefill: EntradaPrefill) =>
    emit({ open: true, mode: "entrada", prefill, key: state.key + 1 }),
  setMode: (mode: Kind | null) => emit({ mode, prefill: null }),
  close: () => emit({ open: false }),
  reset: () => emit({ mode: null, prefill: null }),
};

export function useQuickActions() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}
