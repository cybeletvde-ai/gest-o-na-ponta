export type Kind = "entrada" | "saida" | "retirada";
export type Method = "pix" | "dinheiro" | "credito" | "debito";
export type Category =
  | "materiais"
  | "combustivel"
  | "ferramentas"
  | "contas_fixas"
  | "impostos"
  | "outros";
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

export type ItemType = "servico" | "produto";

export interface Servico {
  id: string;
  /** Código sem o "#" (ex: "001", "PRD01"). */
  sku: string;
  type: ItemType;
  name: string;
  /** Preço de venda em centavos. */
  price: number;
  /** Custo de produto/comissão em centavos (opcional). */
  cost?: number | undefined;
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
  materiais: "Materiais / Insumos",
  combustivel: "Combustível / Deslocamento",
  ferramentas: "Ferramentas / Equipamentos",
  contas_fixas: "Contas Fixas",
  impostos: "Impostos / MEI",
  outros: "Outros",
};

export const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  servico: "Serviço",
  produto: "Produto",
};
