import { describe, expect, it } from "vitest";
import {
  cardFee, digitsToCents, history, nextSku, profitOf, remove, saleDescription, searchItems,
  seedItems, seedState, settle, skuTaken, summarize, upcoming,
} from "./logic";

const now = new Date(2026, 10, 15, 12, 0);

describe("finance rules (dados do Modo Demonstração)", () => {
  it("saldo = entradas recebidas − saídas pagas − retiradas, ignorando pendências", () => {
    const s = summarize(seedState(now).lancamentos);
    expect(s.entradas).toBe(55900);
    expect(s.saidas).toBe(24090);
    expect(s.retiradas).toBe(30000);
    expect(s.balance).toBe(1810);
  });

  it("conta nova começa zerada", () => {
    expect(summarize([]).balance).toBe(0);
  });

  it("retirada diminui o saldo", () => {
    const st = seedState(now);
    st.lancamentos.push({
      id: "r", kind: "retirada", amount: 1000, description: "Retirada Pessoal / Pró-labore",
      method: "pix", status: "done", date: "2026-11-15", createdAt: 1,
    });
    expect(summarize(st.lancamentos).balance).toBe(810);
  });

  it("soma A Receber e A Pagar só das pendências", () => {
    const s = summarize(seedState(now).lancamentos);
    expect(s.aReceber).toBe(20000);
    expect(s.aPagar).toBe(90000);
  });

  it("Receber move a pendência para Já aconteceu com a data de hoje e atualiza o saldo", () => {
    const after = settle(seedState(now), "demo-10", now);
    expect(upcoming(after.lancamentos).map((l) => l.id)).toEqual(["demo-9"]);
    const moved = history(after.lancamentos).find((l) => l.id === "demo-10");
    expect(moved?.date).toBe("2026-11-15");
    expect(summarize(after.lancamentos).balance).toBe(21810);
  });

  it("Pagar uma conta futura reduz o saldo", () => {
    const after = settle(seedState(now), "demo-9", now);
    expect(summarize(after.lancamentos).balance).toBe(1810 - 90000);
  });

  it("excluir um lançamento remove do saldo", () => {
    const after = remove(seedState(now), "demo-1");
    expect(summarize(after.lancamentos).balance).toBe(1810 - 15000);
  });

  it("taxa da maquininha desconta só crédito e débito", () => {
    const fees = { creditFee: 3.49, debitFee: 1.5 };
    expect(cardFee(10000, "credito", fees)).toEqual({ pct: 3.49, fee: 349, net: 9651 });
    expect(cardFee(10000, "debito", fees)).toEqual({ pct: 1.5, fee: 150, net: 9850 });
    expect(cardFee(10000, "pix", fees)).toEqual({ pct: 0, fee: 0, net: 10000 });
  });

  it("valor digitado vira centavos (450 → R$ 4,50)", () => {
    expect(digitsToCents("450")).toBe(450);
    expect(digitsToCents("R$ 1.234,56")).toBe(123456);
  });
});

describe("catálogo de serviços e produtos", () => {
  const items = seedItems();

  it("começa com os 4 itens de exemplo e seus códigos", () => {
    expect(items.map((i) => `#${i.sku}`)).toEqual(["#001", "#002", "#003", "#PRD01"]);
    expect(items.find((i) => i.sku === "PRD01")?.type).toBe("produto");
  });

  it("código em branco gera o próximo sequencial (#004)", () => {
    expect(nextSku(items)).toBe("004");
    expect(nextSku([])).toBe("001");
  });

  it("lucro = preço de venda − custo (Manutenção R$ 150 − R$ 30 = R$ 120)", () => {
    expect(profitOf(items[0]!)).toBe(12000);
    expect(profitOf({ price: 4000, cost: undefined })).toBeUndefined();
  });

  it("Vender usa a descrição com o código: Manutenção Preventiva (#001)", () => {
    expect(saleDescription(items[0]!)).toBe("Manutenção Preventiva (#001)");
  });

  it("busca pelo nome (sem acento) ou pelo código, com filtro de tipo", () => {
    expect(searchItems(items, "manutencao").map((i) => i.sku)).toEqual(["001"]);
    expect(searchItems(items, "#prd").map((i) => i.sku)).toEqual(["PRD01"]);
    expect(searchItems(items, "", "produto").map((i) => i.sku)).toEqual(["PRD01"]);
    expect(searchItems(items, "", "servico")).toHaveLength(3);
  });

  it("não aceita código repetido", () => {
    expect(skuTaken(items, "#prd01")).toBe(true);
    expect(skuTaken(items, "PRD01", "i-prd01")).toBe(false);
  });
});
