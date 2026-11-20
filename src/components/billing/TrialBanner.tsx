import { Clock } from "lucide-react";

import { accessFor, trialBannerText } from "@/lib/billing/subscription";
import { useSubscription } from "@/lib/finance/store";

/** Faixa discreta no topo do Início durante o teste grátis. */
export function TrialBanner() {
  const { subscription, mode, ready } = useSubscription();
  if (mode !== "user" || !ready) return null;
  const access = accessFor(subscription);
  if (access.kind !== "trial") return null;
  return (
    <p
      role="status"
      className="mb-4 flex items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-2 text-center text-xs font-bold text-primary"
    >
      <Clock className="size-4 shrink-0" aria-hidden="true" />
      {trialBannerText(access.daysLeft)}
    </p>
  );
}
