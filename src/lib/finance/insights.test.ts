import { describe, expect, it } from "vitest";
import { periodRange, raioX } from "./insights";
import { seedItems } from "./logic";
import type { Lancamento } from "./types";

const now = new Date(2026, 10, 16, 12, 0);
let n = 0;
const l = (p: Partial<Lancamento>): Lancamento => ({
  id: `x${n++}`, kind: "entrada", amount: 0, description: "", status: "done",
  date: "2026-11-10", createdAt: n, ...p,
});

const items: Lancamento[] = [
  l({ amount: 4000, description: "Manutenção Preventiva (#001)", method: "pix" }),
  l({ amount: 4000, description: "Manutenção Preventiva (#001)", method: "dinheiro" }),
  l({ amount: 8000, description: "Kit de Peças (#PRD01)", method: "credito" }),
  l({ amount: 4000, description: "Manutenção Preventiva", method: "pix" }),
  l({ kind: "saida", amount: 3000, description: "Materiais", category: "materiais" }),
  l({ kind: "saida", amount: 1000, description: "Luz", category: "contas_fixas" }),
  l({ kind: "retirada", amount: 4000, description: "Pró-labore", method: "pix" }),
  // não contam: pendente e fora do período
  l({ amount: 99900, description: "Fiado", status: "pending", date: "2026-11-20" }),
  l({ amount: 50000, description: "Outubro", date: "2026-10-31", method: "pix" }),
];

describe("Raio-X", () => {
  const range = periodRange("este_mes", now);
  const r = raioX(items, seedItems(), range);

  it("períodos: Este Mês, Mês Passado e Últimos 7 dias", () => {
    expect(range).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    expect(periodRange("mes_passado", now)).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(periodRange("ultimos_7", now)).toEqual({ from: "2026-11-10", to: "2026-11-16" });
  });

  it("lucro livre = entrou − saiu − retiradas, só do período e sem pendências", () => {
    expect(r.faturamento).toBe(20000);
    expect(r.custos).toBe(4000);
    expect(r.retiradas).toBe(4000);
    expect(r.resultado).toBe(12000);
    expect(r.margem).toBe(60);
  });

  it("margem negativa quando sai mais do que entra", () => {
    const neg = raioX([l({ amount: 1000, method: "pix" }), l({ kind: "saida", amount: 1500 })], [], range);
    expect(neg.margem).toBe(-50);
  });

  it("saídas por categoria incluem a Retirada Pessoal, com %", () => {
    const by = Object.fromEntries(r.saidasPorCategoria.map((s) => [s.key, [s.amount, s.pct]]));
    expect(by["materiais"]).toEqual([3000, 38]);
    expect(by["contas_fixas"]).toEqual([1000, 13]);
    expect(by["retirada"]).toEqual([4000, 50]);
  });

  it("campeões juntam vendas pelo código ou nome e ordenam pelo total faturado", () => {
    expect(r.campeoes).toEqual([
      { name: "Manutenção Preventiva", sku: "001", count: 3, total: 12000 },
      { name: "Kit de Peças", sku: "PRD01", count: 1, total: 8000 },
    ]);
  });

  it("formas de pagamento em R$ e %", () => {
    const by = Object.fromEntries(r.pagamentos.map((p) => [p.key, [p.amount, p.pct]]));
    expect(by).toEqual({ pix: [8000, 40], dinheiro: [4000, 20], credito: [8000, 40], debito: [0, 0] });
  });
});
