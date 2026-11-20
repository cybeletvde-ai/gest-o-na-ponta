<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- The bottom navigation and + action sheet live in `src/components/app/` and are mounted once in `src/routes/__root.tsx`, so every tab route gets them without repeating code.
- Finance and company data (lançamentos, serviços, profiles) live behind `src/lib/finance/store.ts`: Lovable Cloud tables scoped per account by RLS, or in-memory seed data in Modo Demonstração; pure rules (balance, settle, totals) live in `src/lib/finance/logic.ts` with tests, so storage can move online without touching screens.
- Raio-X reports are computed by pure functions in `src/lib/finance/insights.ts` (with tests) from the same lançamentos and catalog, so the report always matches Caixa without storing extra data.
- The + sheet's open/mode/prefill state lives in `src/lib/ui/quick-actions.ts`, so any screen (e.g. Vender) can open a prefilled Registrar Entrada.
- Login gating is done by `src/components/app/AppFrame.tsx` (session from `src/lib/auth/session.ts`), not an `_authenticated` layout, because Modo Demonstração must open the app without an account; public pages (`/auth/*`, `/reset-password`) are listed there.
- The Raio-X CSV export is built by pure functions in `src/lib/finance/report.ts` (with tests) on top of `raioX()`, so the file always matches the screen totals for the selected period.
- Phone install is manifest-only (`public/manifest.webmanifest` + icons + head tags in `__root.tsx`), with no service worker, so previews never serve stale cached code.
- Subscription access rules live in `src/lib/billing/subscription.ts` (pure, tested) and are enforced in `AppFrame`; only the Kiwify webhook (`/api/public/kiwify-webhook`, HMAC-verified) changes status via a service-role-only SQL function, and a trigger stops users from editing their own status/trial date.
- `.env` holds only publishable Cloud values and must stay committed (not gitignored): the publish build reads `VITE_SUPABASE_*` from it, and without them the published app crashes on load.
