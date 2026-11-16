import { formatCnae, maskCep, maskPhone, onlyDigits } from "./format";
import type { Enquadramento, Profile } from "./types";

interface BrasilApiCnpj {
  razao_social?: string | null;
  nome_fantasia?: string | null;
  cnae_fiscal?: number | string | null;
  cnae_fiscal_descricao?: string | null;
  descricao_tipo_de_logradouro?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  uf?: string | null;
  cep?: string | null;
  ddd_telefone_1?: string | null;
  email?: string | null;
  opcao_pelo_mei?: boolean | null;
  porte?: string | null;
}

function enquadramentoFrom(d: BrasilApiCnpj): Enquadramento | undefined {
  if (d.opcao_pelo_mei) return "mei";
  const porte = (d.porte ?? "").toUpperCase();
  if (porte.includes("MICRO")) return "me";
  if (porte.includes("PEQUENO")) return "epp";
  return undefined;
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

/** Busca dados públicos do CNPJ na BrasilAPI. Lança erro com mensagem amigável. */
export async function lookupCnpj(cnpj: string): Promise<Partial<Profile>> {
  const digits = onlyDigits(cnpj);
  if (digits.length !== 14) throw new Error("Digite os 14 números do CNPJ.");
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
  if (res.status === 404 || res.status === 400) throw new Error("CNPJ não encontrado.");
  if (!res.ok) throw new Error("Não foi possível consultar o CNPJ agora. Tente de novo.");
  const d = (await res.json()) as BrasilApiCnpj;

  const street = [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(" ");
  const out: Partial<Profile> = {
    razaoSocial: d.razao_social ?? "",
    nomeFantasia: d.nome_fantasia || d.razao_social || "",
    cnae: d.cnae_fiscal
      ? `${formatCnae(d.cnae_fiscal)}${d.cnae_fiscal_descricao ? ` - ${d.cnae_fiscal_descricao}` : ""}`
      : "",
    logradouro: street ? titleCase(street) : "",
    numero: d.numero ?? "",
    complemento: d.complemento ? titleCase(d.complemento) : "",
    bairro: d.bairro ? titleCase(d.bairro) : "",
    cidade: d.municipio ? titleCase(d.municipio) : "",
    uf: (d.uf ?? "").toUpperCase(),
    cep: d.cep ? maskCep(d.cep) : "",
  };
  if (d.ddd_telefone_1) out.telefone = maskPhone(d.ddd_telefone_1);
  if (d.email) out.emailComercial = d.email.toLowerCase();
  const enq = enquadramentoFrom(d);
  if (enq) out.enquadramento = enq;
  return out;
}

interface ViaCep {
  erro?: boolean | string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

/** Busca o endereço do CEP no ViaCEP. Lança erro com mensagem amigável. */
export async function lookupCep(cep: string): Promise<Partial<Profile>> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) throw new Error("Digite os 8 números do CEP.");
  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!res.ok) throw new Error("Não foi possível consultar o CEP agora.");
  const d = (await res.json()) as ViaCep;
  if (d.erro) throw new Error("CEP não encontrado.");
  return {
    logradouro: d.logradouro ?? "",
    bairro: d.bairro ?? "",
    cidade: d.localidade ?? "",
    uf: d.uf ?? "",
    ...(d.complemento ? { complemento: d.complemento } : {}),
  };
}
