export type Kind = "entrada" | "saida" | "retirada";
export type Method = "pix" | "dinheiro" | "credito" | "debito";
export type Category = "produtos" | "contas_fixas" | "impostos" | "outros";
export type Status = "done" | "pending";

export interface Lancamento {
  id: string;
  kind: Kind;
  /** Valor em centavos (sempre positivo). */
  amount: number;
  description: string;
  method?: Method | undefined;
  category?: Category | undefined;
  status: Status;
  /** yyyy-MM-dd. Se "done": data em que aconteceu. Se "pending": data prevista / vencimento. */
  date: string;
  clientName?: string | undefined;
  createdAt: number;
}

export interface Servico {
  id: string;
  name: string;
  /** Preço sugerido em centavos. */
  price?: number | undefined;
}

export interface FinanceState {
  lancamentos: Lancamento[];
  servicos: Servico[];
}

export const METHOD_LABEL: Record<Method, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  credito: "Crédito",
  debito: "Débito",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  produtos: "Produtos/Insumos",
  contas_fixas: "Contas Fixas",
  impostos: "Impostos/MEI",
  outros: "Outros",
};
