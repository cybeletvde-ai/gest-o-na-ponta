import { describe, expect, it } from "vitest";
import { digitsToCents, history, seedState, settle, remove, summarize, upcoming } from "./logic";

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
