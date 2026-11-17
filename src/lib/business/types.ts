export type Enquadramento = "mei" | "me" | "epp" | "autonomo";

export interface Profile {
  adminName: string;
  email: string;
  phone: string;
  /** Percentual (ex: 3.49). */
  creditFee: number;
  debitFee: number;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  enquadramento: Enquadramento | "";
  cnae: string;
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  telefone: string;
  celular: string;
  emailComercial: string;
}

export const EMPTY_PROFILE: Profile = {
  adminName: "",
  email: "",
  phone: "",
  creditFee: 0,
  debitFee: 0,
  cnpj: "",
  razaoSocial: "",
  nomeFantasia: "",
  enquadramento: "",
  cnae: "",
  inscricaoEstadual: "",
  inscricaoMunicipal: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  telefone: "",
  celular: "",
  emailComercial: "",
};

export const ENQUADRAMENTO_LABEL: Record<Enquadramento, string> = {
  mei: "MEI",
  me: "ME",
  epp: "EPP",
  autonomo: "Autônomo / CPF",
};

/** Colunas da tabela public.profiles ↔ campos do app. */
export const PROFILE_COLUMNS: Record<keyof Profile, string> = {
  adminName: "admin_name",
  email: "email",
  phone: "phone",
  creditFee: "credit_fee",
  debitFee: "debit_fee",
  cnpj: "cnpj",
  razaoSocial: "razao_social",
  nomeFantasia: "nome_fantasia",
  enquadramento: "enquadramento",
  cnae: "cnae",
  inscricaoEstadual: "inscricao_estadual",
  inscricaoMunicipal: "inscricao_municipal",
  cep: "cep",
  logradouro: "logradouro",
  numero: "numero",
  complemento: "complemento",
  bairro: "bairro",
  cidade: "cidade",
  uf: "uf",
  telefone: "telefone",
  celular: "celular",
  emailComercial: "email_comercial",
};
