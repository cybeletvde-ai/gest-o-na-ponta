import { useState } from "react";
import { BarChart3, CheckCircle2, FileSpreadsheet, LogOut, RefreshCw, Smartphone, Wallet, Wrench } from "lucide-react";

import { BrandMark } from "@/components/auth/BrandMark";
import { Button } from "@/components/ui/button";
import { authActions } from "@/lib/auth/session";
import { KIWIFY_CHECKOUT_URL, PRECO_ASSINATURA } from "@/lib/billing/subscription";
import { refreshSubscription } from "@/lib/finance/store";

const BENEFITS = [
  { icon: Wallet, text: "Caixa completo: entradas, saídas, retiradas e contas a receber e a pagar" },
  { icon: Wrench, text: "Catálogo de serviços e produtos com lucro por venda e botão Vender" },
  { icon: BarChart3, text: "Raio-X do negócio: lucro real, margem e para onde foi o dinheiro" },
  { icon: FileSpreadsheet, text: "Relatório para Excel com um toque" },
  { icon: Smartphone, text: "Seus dados salvos online, em qualquer celular" },
];

export function SubscriptionExpired({ reason }: { reason: "trial" | "bloqueado" }) {
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);

  async function check() {
    setChecking(true);
    await refreshSubscription();
    setChecking(false);
    setChecked(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 pt-[calc(2.5rem+env(safe-area-inset-top))] pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
      <header className="flex flex-col items-center gap-3 text-center">
        <BrandMark />
        <h1 className="text-2xl font-extrabold tracking-tight text-primary text-balance">
          {reason === "trial" ? "Seu teste grátis terminou" : "Sua assinatura está inativa"}
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Seus lançamentos e serviços continuam guardados. Assine para voltar a usar o Meu Negócio
          no Azul.
        </p>
      </header>

      <section aria-label="O que você tem na assinatura" className="mt-7 rounded-3xl border border-border bg-surface p-5">
        <ul className="flex flex-col gap-3 text-sm">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="pt-1.5 text-pretty">{text}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 flex flex-col gap-3">
        <Button asChild variant="entrada" size="submit">
          <a href={KIWIFY_CHECKOUT_URL} target="_blank" rel="noopener noreferrer">
            <CheckCircle2 aria-hidden="true" />
            Assinar Agora por {PRECO_ASSINATURA}
          </a>
        </Button>
        <p className="text-center text-xs text-muted-foreground text-pretty">
          Use na compra o mesmo e-mail da sua conta para liberar o acesso automaticamente.
        </p>
        <Button variant="outline" className="h-11 rounded-2xl font-bold" onClick={check} disabled={checking}>
          <RefreshCw className={checking ? "animate-spin" : undefined} aria-hidden="true" />
          Já assinei, verificar
        </Button>
        {checked && !checking && (
          <p role="status" className="text-center text-xs font-semibold text-muted-foreground">
            Ainda não recebemos a confirmação do pagamento. Pode levar alguns minutos.
          </p>
        )}
        <Button variant="ghost" className="mt-2 text-muted-foreground" onClick={() => void authActions.signOut()}>
          <LogOut aria-hidden="true" />
          Sair da Conta
        </Button>
      </div>
    </main>
  );
}
