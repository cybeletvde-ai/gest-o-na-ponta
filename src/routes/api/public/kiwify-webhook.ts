import { createFileRoute } from "@tanstack/react-router";

import { isValidKiwifySignature, kiwifyPayloadSchema, statusForEvent } from "@/lib/billing/kiwify";

const MAX_BODY = 200_000;

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export const Route = createFileRoute("/api/public/kiwify-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env["KIWIFY_WEBHOOK_TOKEN"];
        if (!token) {
          console.error("[kiwify-webhook] KIWIFY_WEBHOOK_TOKEN não configurado");
          return json({ error: "not_configured" }, 503);
        }

        const raw = await request.text();
        if (raw.length > MAX_BODY) return json({ error: "too_large" }, 413);

        const signature = new URL(request.url).searchParams.get("signature");
        if (!(await isValidKiwifySignature(raw, signature, token))) {
          return json({ error: "invalid_signature" }, 401);
        }

        let body: unknown;
        try {
          body = JSON.parse(raw);
        } catch {
          return json({ error: "invalid_json" }, 400);
        }
        const parsed = kiwifyPayloadSchema.safeParse(body);
        if (!parsed.success) return json({ error: "invalid_payload" }, 400);

        const status = statusForEvent(parsed.data.webhook_event_type);
        if (!status) return json({ ok: true, ignored: true });

        const email = parsed.data.Customer?.email;
        if (!email) return json({ ok: true, matched: 0 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("set_subscription_status_by_email", {
          _email: email,
          _status: status,
        });
        if (error) {
          console.error("[kiwify-webhook] falha ao atualizar assinatura", error.message);
          return json({ error: "update_failed" }, 500);
        }
        return json({ ok: true, status, matched: data ?? 0 });
      },
    },
  },
});
