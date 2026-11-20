import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { isValidKiwifySignature, statusForEvent } from "./kiwify";

describe("webhook da Kiwify", () => {
  it("order_approved e subscription_renewed ativam", () => {
    expect(statusForEvent("order_approved")).toBe("ativo");
    expect(statusForEvent("subscription_renewed")).toBe("ativo");
  });

  it("cancelamento, atraso e reembolso bloqueiam", () => {
    expect(statusForEvent("subscription_canceled")).toBe("bloqueado");
    expect(statusForEvent("subscription_late")).toBe("bloqueado");
    expect(statusForEvent("order_refunded")).toBe("bloqueado");
  });

  it("outros eventos são ignorados", () => {
    expect(statusForEvent("pix_created")).toBeNull();
    expect(statusForEvent("toString")).toBeNull();
    expect(statusForEvent(undefined)).toBeNull();
  });

  it("aceita só a assinatura HMAC-SHA1 correta do corpo cru", async () => {
    const body = '{"webhook_event_type":"order_approved","Customer":{"email":"a@b.com"}}';
    const good = createHmac("sha1", "tok123").update(body).digest("hex");
    expect(await isValidKiwifySignature(body, good, "tok123")).toBe(true);
    expect(await isValidKiwifySignature(body, good, "outro")).toBe(false);
    expect(await isValidKiwifySignature(body + " ", good, "tok123")).toBe(false);
    expect(await isValidKiwifySignature(body, null, "tok123")).toBe(false);
  });
});
