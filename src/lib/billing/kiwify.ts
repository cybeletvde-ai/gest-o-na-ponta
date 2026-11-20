import { z } from "zod";

import type { StatusAssinatura } from "./subscription";

/** Evento da Kiwify (webhook_event_type) → status da assinatura. Outros eventos são ignorados. */
export const KIWIFY_EVENT_STATUS: Readonly<Record<string, Exclude<StatusAssinatura, "trial">>> = {
  order_approved: "ativo",
  subscription_renewed: "ativo",
  subscription_canceled: "bloqueado",
  subscription_late: "bloqueado",
  order_refunded: "bloqueado",
  chargeback: "bloqueado",
};

export function statusForEvent(event: string | undefined): "ativo" | "bloqueado" | null {
  if (!event) return null;
  return Object.prototype.hasOwnProperty.call(KIWIFY_EVENT_STATUS, event)
    ? (KIWIFY_EVENT_STATUS[event] ?? null)
    : null;
}

export const kiwifyPayloadSchema = z.object({
  webhook_event_type: z.string().max(64).optional(),
  Customer: z
    .object({ email: z.string().trim().email().max(320).optional().nullable() })
    .passthrough()
    .optional()
    .nullable(),
});

async function hmacSha1Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** A Kiwify manda ?signature= com HMAC-SHA1 (hex) do corpo cru, assinado com o token do webhook. */
export async function isValidKiwifySignature(
  rawBody: string,
  signature: string | null,
  token: string,
): Promise<boolean> {
  if (!token || !signature || !/^[0-9a-f]{40}$/i.test(signature)) return false;
  const expected = await hmacSha1Hex(token, rawBody);
  return safeEqual(expected, signature.toLowerCase());
}
