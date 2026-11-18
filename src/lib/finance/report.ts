import { PERIOD_LABEL, raioX, type Period } from "./insights";
import { CATEGORY_LABEL, METHOD_LABEL, type Kind, type Lancamento, type Servico } from "./types";

const KIND_LABEL: Record<Kind, string> = {
  entrada: "Entrada",
  saida: "Saída",
  retirada: "Retirada",
};

/** Centavos → "1234,56" (número que o Excel em pt-BR reconhece). */
export function centsToCsvNumber(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, "0")}`;
}

/** yyyy-MM-dd → dd/MM/yyyy */
export function brDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Escapa um campo para CSV com ";" e evita fórmulas (=, +, -, @) abertas pelo Excel. */
export function csvField(value: string): string {
  let v = value;
  if (/^[=+\-@\t\r]/.test(v) && !/^-\d+(,\d+)?$/.test(v)) v = `'${v}`;
  if (/[";\r\n]/.test(v)) v = `"${v.replace(/"/g, '""')}"`;
  return v;
}

const row = (cells: string[]) => cells.map(csvField).join(";");

/**
 * Relatório do período: resumo do lucro + todos os lançamentos já recebidos/pagos
 * (os mesmos números do Raio-X). Linhas separadas por CRLF; o BOM é adicionado no download.
 */
export function buildReportCsv(
  items: Lancamento[],
  catalog: Servico[],
  period: Period,
  range: { from: string; to: string },
  businessName = "",
): string {
  const r = raioX(items, catalog, range);
  const rows = items
    .filter((l) => l.status === "done" && l.date >= range.from && l.date <= range.to)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);

  const lines = [
    row([`Relatório — ${businessName.trim() || "Meu Negócio no Azul"}`]),
    row(["Período", `${PERIOD_LABEL[period]} (${brDate(range.from)} a ${brDate(range.to)})`]),
    "",
    row(["Resumo do Lucro", "Valor (R$)"]),
    row(["Faturamento Total (Entrou)", centsToCsvNumber(r.faturamento)]),
    row(["Custos e Contas do Negócio (Saiu)", centsToCsvNumber(r.custos)]),
    row(["Minhas Retiradas (Pró-labore)", centsToCsvNumber(r.retiradas)]),
    row(["Resultado Final (Lucro Livre no Caixa)", centsToCsvNumber(r.resultado)]),
    row(["Margem de Lucro", `${r.margem}%`]),
    "",
    row(["Data", "Tipo", "Descrição", "Categoria", "Forma de Pagamento", "Cliente", "Valor (R$)"]),
    ...rows.map((l) =>
      row([
        brDate(l.date),
        KIND_LABEL[l.kind],
        l.description,
        l.kind === "saida" ? CATEGORY_LABEL[l.category ?? "outros"] : l.kind === "retirada" ? "Retirada Pessoal" : "",
        l.method ? METHOD_LABEL[l.method] : "",
        l.clientName ?? "",
        centsToCsvNumber(l.kind === "entrada" ? l.amount : -l.amount),
      ]),
    ),
  ];
  return lines.join("\r\n") + "\r\n";
}

export function reportFileName(range: { from: string; to: string }): string {
  return `relatorio-meu-negocio-${range.from}-a-${range.to}.csv`;
}
