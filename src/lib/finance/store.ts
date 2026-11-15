import { useSyncExternalStore } from "react";
import * as logic from "./logic";
import type { FinanceState, Lancamento, Servico } from "./types";

// Dados ficam salvos neste aparelho (localStorage). Trocar por banco online exige mudar só este arquivo.
const KEY = "meu-caixa:v2";
const OLD_KEY = "meu-caixa:v1";
const EMPTY: FinanceState = { lancamentos: [], servicos: [] };

let state: FinanceState | null = null;
const listeners = new Set<() => void>();

function load(): FinanceState {
  if (state) return state;
  try {
    const raw = window.localStorage.getItem(KEY);
    const old = raw ? null : window.localStorage.getItem(OLD_KEY);
    if (raw) state = JSON.parse(raw) as FinanceState;
    else if (old) {
      // Versão anterior: mantém os lançamentos e troca o catálogo pelo novo (com códigos).
      const prev = JSON.parse(old) as FinanceState;
      state = { lancamentos: prev.lancamentos, servicos: logic.seedItems() };
    } else state = logic.seedState();
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
  saveItem(item: Omit<Servico, "id" | "sku"> & { id?: string | undefined; sku: string }) {
    const s = load();
    const sku = logic.normalizeSku(item.sku) || logic.nextSku(s.servicos);
    set(logic.upsertItem(s, { ...item, id: item.id ?? newId(), sku }));
    return sku;
  },
  removeItem(id: string) {
    set(logic.removeItem(load(), id));
  },
};
