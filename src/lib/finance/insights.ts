import { addDays, endOfMonth, startOfMonth, subMonths } from "date-fns";
import { toISODate } from "./logic";
import type { Category, Lancamento, Method, Servico } from "./types";

export type Period = "este_mes" | "mes_passado" | "ultimos_7";

export const PERIOD_LABEL: Record<Period, string> = {
  este_mes: "Este Mês",
  mes_passado: "Mês Passado",
  ultimos_7: "Últimos 7 dias",
};

/** Intervalo inclusivo em yyyy-MM-dd. */
export function periodRange(period: Period, now: Date = new Date()) {
  if (period === "este_mes")
    return { from: toISODate(startOfMonth(now)), to: toISODate(endOfMonth(now)) };
  if (period === "mes_passado") {
    const m = subMonths(now, 1);
    return { from: toISODate(startOfMonth(m)), to: toISODate(endOfMonth(m)) };
  }
  return { from: toISODate(addDays(now, -6)), to: toISODate(now) };
}

export type OutBucket = Category | "retirada";
export const OUT_BUCKETS: { key: OutBucket; label: string }[] = [
  { key: "produtos", label: "Produtos/Insumos" },
  { key: "contas_fixas", label: "Contas Fixas" },
  { key: "impostos", label: "Impostos/MEI" },
  { key: "retirada", label: "Retirada Pessoal" },
  { key: "outros", label: "Outros" },
];

export interface Share<K> {
  key: K;
  amount: number;
  /** 0–100, arredondado. */
  pct: number;
}

export interface Champion {
  name: string;
  sku?: string | undefined;
  count: number;
  total: number;
}

export interface RaioX {
  faturamento: number;
  custos: number;
  retiradas: number;
  /** Lucro livre no caixa = faturamento − custos − retiradas. */
  resultado: number;
  /** Margem de lucro em % do faturamento (0 se não entrou nada). */
  margem: number;
  saidasPorCategoria: Share<OutBucket>[];
  campeoes: Champion[];
  pagamentos: Share<Method>[];
}

const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

/** Acha o item do catálogo pela descrição "Nome (#SKU)" ou pelo nome. */
function matchItem(desc: string, catalog: Servico[]): Servico | undefined {
  const sku = /\(#([^)]+)\)\s*$/.exec(desc)?.[1]?.toUpperCase();
  if (sku) {
    const bySku = catalog.find((i) => i.sku.toUpperCase() === sku);
    if (bySku) return bySku;
  }
  const d = desc.trim().toLowerCase();
  return catalog.find((i) => i.name.toLowerCase() === d);
}

export function raioX(
  items: Lancamento[],
  catalog: Servico[],
  range: { from: string; to: string },
): RaioX {
  const done = items.filter((l) => l.status === "done" && l.date >= range.from && l.date <= range.to);
  let faturamento = 0;
  let custos = 0;
  let retiradas = 0;
  const out = new Map<OutBucket, number>();
  const pay = new Map<Method, number>();
  const champs = new Map<string, Champion>();

  for (const l of done) {
    if (l.kind === "entrada") {
      faturamento += l.amount;
      const m = l.method ?? "pix";
      pay.set(m, (pay.get(m) ?? 0) + l.amount);
      const item = matchItem(l.description, catalog);
      const key = item ? `id:${item.id}` : `d:${l.description.trim().toLowerCase()}`;
      const c = champs.get(key) ?? {
        name: item?.name ?? l.description.trim(),
        sku: item?.sku,
        count: 0,
        total: 0,
      };
      c.count += 1;
      c.total += l.amount;
      champs.set(key, c);
    } else if (l.kind === "saida") {
      custos += l.amount;
      const k = l.category ?? "outros";
      out.set(k, (out.get(k) ?? 0) + l.amount);
    } else {
      retiradas += l.amount;
      out.set("retirada", (out.get("retirada") ?? 0) + l.amount);
    }
  }

  const resultado = faturamento - custos - retiradas;
  const totalOut = custos + retiradas;
  const methods: Method[] = ["pix", "dinheiro", "credito", "debito"];

  return {
    faturamento,
    custos,
    retiradas,
    resultado,
    margem: pct(resultado, faturamento),
    saidasPorCategoria: OUT_BUCKETS.map(({ key }) => ({
      key,
      amount: out.get(key) ?? 0,
      pct: pct(out.get(key) ?? 0, totalOut),
    })),
    campeoes: [...champs.values()]
      .sort((a, b) => b.total - a.total || b.count - a.count)
      .slice(0, 3),
    pagamentos: methods.map((m) => ({
      key: m,
      amount: pay.get(m) ?? 0,
      pct: pct(pay.get(m) ?? 0, faturamento),
    })),
  };
}
