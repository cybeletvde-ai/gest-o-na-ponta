import { useSyncExternalStore } from "react";
import * as logic from "./logic";
import type { FinanceState, Lancamento } from "./types";

// Dados ficam salvos neste aparelho (localStorage). Trocar por banco online exige mudar só este arquivo.
const KEY = "meu-caixa:v1";
const EMPTY: FinanceState = { lancamentos: [], servicos: [] };

let state: FinanceState | null = null;
const listeners = new Set<() => void>();

function load(): FinanceState {
  if (state) return state;
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? (JSON.parse(raw) as FinanceState) : logic.seedState();
  } catch {
    state = logic.seedState();
  }
  persist();
  return state;
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* sem espaço ou modo privado: segue só em memória */
  }
}

function set(next: FinanceState) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useFinance(): FinanceState & { ready: boolean } {
  const s = useSyncExternalStore(subscribe, load, () => EMPTY);
  return { ...s, ready: s !== EMPTY };
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const financeActions = {
  add(item: Omit<Lancamento, "id" | "createdAt">) {
    set(logic.add(load(), { ...item, id: newId(), createdAt: Date.now() }));
  },
  remove(id: string) {
    set(logic.remove(load(), id));
  },
  settle(id: string) {
    set(logic.settle(load(), id));
  },
};
