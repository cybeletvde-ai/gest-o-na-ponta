import { createFileRoute } from "@tanstack/react-router";
import { Home } from "lucide-react";

import { PageShell } from "@/components/app/PageShell";
import { useFinance } from "@/lib/finance/store";
import { formatBRL, summarize } from "@/lib/finance/logic";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — Meu Caixa" },
      { name: "description", content: "Resumo do seu negócio: entradas, saídas e retiradas." },
      { property: "og:title", content: "Início — Meu Caixa" },
      {
        property: "og:description",
        content: "Resumo do seu negócio: entradas, saídas e retiradas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { lancamentos, ready } = useFinance();
  const s = summarize(lancamentos);
  const stats = [
    { label: "Entradas", value: s.entradas },
    { label: "Saídas", value: s.saidas },
    { label: "Retiradas", value: s.retiradas },
  ];

  return (
    <PageShell title="Olá!" subtitle="Veja como está seu negócio hoje" icon={Home}>
      <section className="rounded-3xl bg-hero p-6 text-primary-foreground shadow-action">
        <p className="text-sm font-medium opacity-80">Saldo em caixa</p>
        <p
          className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums"
          aria-busy={!ready}
        >
          {formatBRL(s.balance)}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
          {stats.map((st) => (
            <div key={st.label} className="rounded-2xl bg-surface/10 p-3">
              <p className="text-xs opacity-80">{st.label}</p>
              <p className="text-sm font-bold tabular-nums">{formatBRL(st.value)}</p>
            </div>
          ))}
        </div>
      </section>
      {ready && lancamentos.length === 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Toque no <span className="font-bold text-success">+</span> para registrar seu primeiro
          lançamento.
        </p>
      )}
    </PageShell>
  );
}
