import { addDays, format } from "date-fns";
import type { FinanceState, ItemType, Lancamento, Method, Servico } from "./types";

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

/* ---------- Catálogo (serviços e produtos) ---------- */

/** Catálogo fictício do Modo Demonstração. */
export function seedItems(): Servico[] {
  return [
    { id: "i-001", sku: "001", type: "servico", name: "Manutenção Preventiva", price: 15000, cost: 3000 },
    { id: "i-002", sku: "002", type: "servico", name: "Instalação", price: 20000, cost: 5000 },
    { id: "i-003", sku: "003", type: "servico", name: "Consultoria (1h)", price: 12000 },
    { id: "i-prd01", sku: "PRD01", type: "produto", name: "Kit de Peças", price: 8900, cost: 4500 },
  ];
}

/** Limpa o código digitado: tira "#", espaços e deixa em maiúsculas. */
export function normalizeSku(raw: string): string {
  return raw.replace(/#/g, "").replace(/\s+/g, "").toUpperCase();
}

/** Próximo código automático: maior código só de números + 1, com 3 dígitos (#001, #002...). */
export function nextSku(items: Servico[]): string {
  const max = items.reduce((m, i) => (/^\d+$/.test(i.sku) ? Math.max(m, parseInt(i.sku, 10)) : m), 0);
  return String(max + 1).padStart(3, "0");
}

export function skuTaken(items: Servico[], sku: string, exceptId?: string): boolean {
  const n = normalizeSku(sku);
  return items.some((i) => i.id !== exceptId && normalizeSku(i.sku) === n);
}

/** Lucro por venda = preço − custo. Sem custo cadastrado, não há lucro a mostrar. */
export function profitOf(item: Pick<Servico, "price" | "cost">): number | undefined {
  return item.cost ? item.price - item.cost : undefined;
}

/** Descrição usada ao vender: "Manutenção Preventiva (#001)". */
export function saleDescription(item: Pick<Servico, "name" | "sku">): string {
  return `${item.name} (#${item.sku})`;
}

function fold(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/** Busca por nome ou código (com ou sem "#"), opcionalmente só de um tipo. */
export function searchItems(
  items: Servico[],
  query: string,
  type: ItemType | "todos" = "todos",
): Servico[] {
  const q = fold(query.replace(/#/g, ""));
  return items.filter((i) => {
    if (type !== "todos" && i.type !== type) return false;
    if (!q) return true;
    return fold(i.name).includes(q) || fold(i.sku).includes(q);
  });
}

export function upsertItem(state: FinanceState, item: Servico): FinanceState {
  const exists = state.servicos.some((s) => s.id === item.id);
  return {
    ...state,
    servicos: exists
      ? state.servicos.map((s) => (s.id === item.id ? item : s))
      : [...state.servicos, item],
  };
}

export function removeItem(state: FinanceState, id: string): FinanceState {
  return { ...state, servicos: state.servicos.filter((s) => s.id !== id) };
}

/** Taxa da maquininha: desconta o percentual de crédito/débito do valor bruto. */
export function cardFee(
  amount: number,
  method: Method | undefined,
  fees: { creditFee: number; debitFee: number },
): { pct: number; fee: number; net: number } {
  const pct = method === "credito" ? fees.creditFee : method === "debito" ? fees.debitFee : 0;
  const fee = Math.round((amount * pct) / 100);
  return { pct, fee, net: amount - fee };
}

/** Dados fictícios do Modo Demonstração (nunca usados em contas reais). */
export function seedState(now: Date = new Date()): FinanceState {
  const t = now.getTime();
  const day = (n: number) => toISODate(addDays(now, n));
  const base = { status: "done" as const };
  return {
    servicos: seedItems(),
    lancamentos: [
      { ...base, id: "demo-1", kind: "entrada", amount: 15000, description: "Manutenção Preventiva (#001)", method: "pix", date: day(0), createdAt: t - 1 },
      { ...base, id: "demo-2", kind: "entrada", amount: 8900, description: "Kit de Peças (#PRD01)", method: "credito", date: day(0), createdAt: t - 2 },
      { ...base, id: "demo-3", kind: "entrada", amount: 12000, description: "Consultoria (1h) (#003)", method: "debito", date: day(-1), createdAt: t - 3 },
      { ...base, id: "demo-4", kind: "entrada", amount: 20000, description: "Instalação (#002)", method: "dinheiro", date: day(-3), createdAt: t - 4 },
      { ...base, id: "demo-5", kind: "saida", amount: 4500, description: "Materiais de limpeza", category: "materiais", date: day(-1), createdAt: t - 5 },
      { ...base, id: "demo-6", kind: "saida", amount: 12000, description: "Gasolina", category: "combustivel", date: day(-2), createdAt: t - 6 },
      { ...base, id: "demo-7", kind: "saida", amount: 7590, description: "DAS MEI", category: "impostos", date: day(-5), createdAt: t - 7 },
      { ...base, id: "demo-8", kind: "retirada", amount: 30000, description: "Pró-labore", method: "pix", date: day(-4), createdAt: t - 8 },
      { id: "demo-9", kind: "saida", amount: 90000, description: "Aluguel", category: "contas_fixas", status: "pending", date: day(5), createdAt: t - 9 },
      { id: "demo-10", kind: "entrada", amount: 20000, description: "Instalação (#002)", method: "pix", status: "pending", date: day(2), clientName: "Carlos Lima", createdAt: t - 10 },
    ],
  };
}
