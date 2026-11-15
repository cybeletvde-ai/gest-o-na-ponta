import { addDays, format } from "date-fns";
import type { FinanceState, Lancamento } from "./types";

export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

export interface Summary {
  /** Saldo = entradas recebidas − saídas pagas − retiradas feitas. */
  balance: number;
  entradas: number;
  saidas: number;
  retiradas: number;
  aReceber: number;
  aPagar: number;
}

export function summarize(items: Lancamento[]): Summary {
  const s: Summary = { balance: 0, entradas: 0, saidas: 0, retiradas: 0, aReceber: 0, aPagar: 0 };
  for (const i of items) {
    if (i.status === "done") {
      if (i.kind === "entrada") s.entradas += i.amount;
      else if (i.kind === "saida") s.saidas += i.amount;
      else s.retiradas += i.amount;
    } else {
      if (i.kind === "entrada") s.aReceber += i.amount;
      else s.aPagar += i.amount;
    }
  }
  s.balance = s.entradas - s.saidas - s.retiradas;
  return s;
}

/** Marca uma pendência como recebida/paga hoje, movendo-a para "Já aconteceu". */
export function settle(state: FinanceState, id: string, now: Date = new Date()): FinanceState {
  return {
    ...state,
    lancamentos: state.lancamentos.map((l) =>
      l.id === id && l.status === "pending" ? { ...l, status: "done", date: todayISO(now) } : l,
    ),
  };
}

export function remove(state: FinanceState, id: string): FinanceState {
  return { ...state, lancamentos: state.lancamentos.filter((l) => l.id !== id) };
}

export function add(state: FinanceState, item: Lancamento): FinanceState {
  return { ...state, lancamentos: [item, ...state.lancamentos] };
}

/** Já aconteceu: mais recentes primeiro. */
export function history(items: Lancamento[]): Lancamento[] {
  return items
    .filter((l) => l.status === "done")
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}

/** Vai acontecer: vencimento mais próximo primeiro. */
export function upcoming(items: Lancamento[]): Lancamento[] {
  return items
    .filter((l) => l.status === "pending")
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
}

/** Converte os dígitos digitados (estilo maquininha) em centavos. */
export function digitsToCents(raw: string): number {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  return digits ? parseInt(digits, 10) : 0;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

export function seedState(now: Date = new Date()): FinanceState {
  const t = now.getTime();
  return {
    servicos: [
      { id: "s-corte", name: "Corte", price: 4500 },
      { id: "s-escova", name: "Escova", price: 6000 },
      { id: "s-banho", name: "Banho e Tosa", price: 7000 },
      { id: "s-manicure", name: "Manicure", price: 3500 },
    ],
    lancamentos: [
      {
        id: "seed-1",
        kind: "entrada",
        amount: 8000,
        description: "Escova",
        method: "pix",
        status: "done",
        date: todayISO(now),
        createdAt: t - 3,
      },
      {
        id: "seed-2",
        kind: "saida",
        amount: 3500,
        description: "Shampoo e condicionador",
        category: "produtos",
        status: "done",
        date: toISODate(addDays(now, -1)),
        createdAt: t - 2,
      },
      {
        id: "seed-3",
        kind: "saida",
        amount: 90000,
        description: "Aluguel",
        category: "contas_fixas",
        status: "pending",
        date: toISODate(addDays(now, 5)),
        createdAt: t - 1,
      },
      {
        id: "seed-4",
        kind: "entrada",
        amount: 7000,
        description: "Banho e Tosa",
        method: "pix",
        status: "pending",
        date: toISODate(addDays(now, 2)),
        clientName: "Maria Souza",
        createdAt: t,
      },
    ],
  };
}
