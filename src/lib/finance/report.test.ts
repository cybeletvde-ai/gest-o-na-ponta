import { describe, expect, it } from "vitest";
import { buildReportCsv, centsToCsvNumber, csvField } from "./report";
import type { Lancamento } from "./types";

const base = { createdAt: 1, status: "done" as const };
const items: Lancamento[] = [
  { ...base, id: "1", kind: "entrada", amount: 10000, description: "Corte (#001)", method: "pix", date: "2026-11-05" },
  { ...base, id: "2", kind: "saida", amount: 2550, description: "Luz; água", category: "contas_fixas", date: "2026-11-06" },
  { ...base, id: "3", kind: "retirada", amount: 1000, description: "Pró-labore", date: "2026-11-07" },
  { ...base, id: "4", kind: "entrada", amount: 5000, description: "Fora do período", method: "pix", date: "2026-10-30" },
  { ...base, id: "5", kind: "entrada", amount: 7000, description: "A receber", status: "pending", date: "2026-11-10" },
];
const range = { from: "2026-11-01", to: "2026-11-30" };

describe("relatório CSV", () => {
  it("formata valores com vírgula decimal para o Excel", () => {
    expect(centsToCsvNumber(123456)).toBe("1234,56");
    expect(centsToCsvNumber(-2550)).toBe("-25,50");
  });

  it("separa colunas por ponto e vírgula e protege campos com ;", () => {
    expect(csvField("Luz; água")).toBe('"Luz; água"');
    expect(csvField("=SOMA(A1)")).toBe("'=SOMA(A1)");
  });

  it("traz o resumo do lucro do período", () => {
    const csv = buildReportCsv(items, [], "este_mes", range, "Studio Bella");
    expect(csv).toContain("Relatório — Studio Bella");
    expect(csv).toContain("Faturamento Total (Entrou);100,00");
    expect(csv).toContain("Custos e Contas do Negócio (Saiu);25,50");
    expect(csv).toContain("Minhas Retiradas (Pró-labore);10,00");
    expect(csv).toContain("Resultado Final (Lucro Livre no Caixa);64,50");
    expect(csv).toContain("Margem de Lucro;65%");
  });

  it("lista só entradas, saídas e retiradas já acontecidas dentro do período", () => {
    const csv = buildReportCsv(items, [], "este_mes", range);
    expect(csv).toContain("05/11/2026;Entrada;Corte (#001);;Pix;;100,00");
    expect(csv).toContain('06/11/2026;Saída;"Luz; água";Contas Fixas;;;-25,50');
    expect(csv).toContain("07/11/2026;Retirada;Pró-labore;Retirada Pessoal;;;-10,00");
    expect(csv).not.toContain("Fora do período");
    expect(csv).not.toContain("A receber");
  });
});
