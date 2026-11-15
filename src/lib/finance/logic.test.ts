import { describe, expect, it } from "vitest";
import {
  digitsToCents, history, nextSku, profitOf, remove, saleDescription, searchItems, seedItems,
  seedState, settle, skuTaken, summarize, upcoming,
} from "./logic";

const now = new Date(2026, 10, 15, 12, 0);

describe("finance rules", () => {
  it("saldo = entradas recebidas − saídas pagas − retiradas, ignorando pendências", () => {
    const s = summarize(seedState(now).lancamentos);
    expect(s.entradas).toBe(8000);
    expect(s.saidas).toBe(3500);
    expect(s.balance).toBe(4500);
  });

  it("retirada diminui o saldo", () => {
    const st = seedState(now);
    st.lancamentos.push({
      id: "r", kind: "retirada", amount: 1000, description: "Retirada Pessoal / Pró-labore",
      method: "pix", status: "done", date: "2026-11-15", createdAt: 1,
    });
    expect(summarize(st.lancamentos).balance).toBe(3500);
  });

  it("soma A Receber e A Pagar só das pendências", () => {
    const s = summarize(seedState(now).lancamentos);
    expect(s.aReceber).toBe(7000);
    expect(s.aPagar).toBe(90000);
  });

  it("Receber move a pendência para Já aconteceu com a data de hoje e atualiza o saldo", () => {
    const after = settle(seedState(now), "seed-4", now);
    expect(upcoming(after.lancamentos).map((l) => l.id)).toEqual(["seed-3"]);
    const moved = history(after.lancamentos).find((l) => l.id === "seed-4");
    expect(moved?.date).toBe("2026-11-15");
    expect(summarize(after.lancamentos).balance).toBe(11500);
  });

  it("Pagar uma conta futura reduz o saldo", () => {
    const after = settle(seedState(now), "seed-3", now);
    expect(summarize(after.lancamentos).balance).toBe(4500 - 90000);
  });

  it("excluir um lançamento remove do saldo", () => {
    const after = remove(seedState(now), "seed-1");
    expect(summarize(after.lancamentos).balance).toBe(-3500);
  });

  it("valor digitado vira centavos (450 → R$ 4,50)", () => {
    expect(digitsToCents("450")).toBe(450);
    expect(digitsToCents("R$ 1.234,56")).toBe(123456);
  });
});

describe("catálogo de serviços e produtos", () => {
  const items = seedItems();

  it("começa com os 4 itens de exemplo e seus códigos", () => {
    expect(items.map((i) => `#${i.sku}`)).toEqual(["#001", "#002", "#POM01", "#HID01"]);
    expect(items.find((i) => i.sku === "POM01")?.type).toBe("produto");
  });

  it("código em branco gera o próximo sequencial (#003)", () => {
    expect(nextSku(items)).toBe("003");
    expect(nextSku([])).toBe("001");
  });

  it("lucro = preço de venda − custo (Corte R$ 40 − R$ 5 = R$ 35)", () => {
    expect(profitOf(items[0]!)).toBe(3500);
    expect(profitOf({ price: 4000, cost: undefined })).toBeUndefined();
  });

  it("Vender usa a descrição com o código: Corte de Cabelo (#001)", () => {
    expect(saleDescription(items[0]!)).toBe("Corte de Cabelo (#001)");
  });

  it("busca pelo nome (sem acento) ou pelo código, com filtro de tipo", () => {
    expect(searchItems(items, "hidratacao").map((i) => i.sku)).toEqual(["HID01"]);
    expect(searchItems(items, "#pom").map((i) => i.sku)).toEqual(["POM01"]);
    expect(searchItems(items, "", "produto").map((i) => i.sku)).toEqual(["POM01"]);
    expect(searchItems(items, "", "servico")).toHaveLength(3);
  });

  it("não aceita código repetido", () => {
    expect(skuTaken(items, "#pom01")).toBe(true);
    expect(skuTaken(items, "POM01", "i-pom01")).toBe(false);
  });
});
