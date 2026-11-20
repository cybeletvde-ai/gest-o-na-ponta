/** Link de checkout da assinatura na Kiwify. Troque aqui pelo link do seu produto. */
export const KIWIFY_CHECKOUT_URL = "https://kiwify.com.br";
/** Texto do preço mostrado no botão de assinar. */
export const PRECO_ASSINATURA = "R$ 29,90/mês";

export type StatusAssinatura = "trial" | "ativo" | "bloqueado";

export interface Subscription {
  status: StatusAssinatura;
  /** Fim do teste grátis (ISO). */
  trialAte: string;
}

export type Access =
  | { kind: "desconhecido" }
  | { kind: "ativo" }
  | { kind: "trial"; daysLeft: number }
  | { kind: "expirado"; reason: "trial" | "bloqueado" };

const DAY = 24 * 60 * 60 * 1000;

export function parseSubscription(row: Record<string, unknown> | null): Subscription | null {
  if (!row) return null;
  const status = row["status_assinatura"];
  const trialAte = row["trial_ate"];
  if (status !== "trial" && status !== "ativo" && status !== "bloqueado") return null;
  return { status, trialAte: typeof trialAte === "string" ? trialAte : "" };
}

/** Decide o acesso: ativo libera; trial libera até trial_ate; bloqueado ou teste vencido bloqueia. */
export function accessFor(sub: Subscription | null, now: number = Date.now()): Access {
  if (!sub) return { kind: "desconhecido" };
  if (sub.status === "ativo") return { kind: "ativo" };
  if (sub.status === "bloqueado") return { kind: "expirado", reason: "bloqueado" };
  const end = Date.parse(sub.trialAte);
  if (!Number.isFinite(end) || end <= now) return { kind: "expirado", reason: "trial" };
  return { kind: "trial", daysLeft: Math.max(1, Math.ceil((end - now) / DAY)) };
}

export function trialBannerText(daysLeft: number): string {
  return daysLeft === 1
    ? "Período de teste grátis: resta 1 dia"
    : `Período de teste grátis: restam ${daysLeft} dias`;
}
