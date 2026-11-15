import { createFileRoute } from "@tanstack/react-router";
import { Home } from "lucide-react";

import { PageShell } from "@/components/app/PageShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — Meu Caixa" },
      { name: "description", content: "Resumo do seu negócio: entradas, saídas e retiradas." },
      { property: "og:title", content: "Início — Meu Caixa" },
      { property: "og:description", content: "Resumo do seu negócio: entradas, saídas e retiradas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PageShell title="Olá!" subtitle="Veja como está seu negócio hoje" icon={Home}>
      <section className="rounded-3xl bg-hero p-6 text-primary-foreground shadow-action">
        <p className="text-sm font-medium opacity-80">Saldo em caixa</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight">R$ 0,00</p>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-surface/10 p-3">
            <p className="opacity-80">Entradas</p>
            <p className="text-lg font-bold">R$ 0,00</p>
          </div>
          <div className="rounded-2xl bg-surface/10 p-3">
            <p className="opacity-80">Saídas</p>
            <p className="text-lg font-bold">R$ 0,00</p>
          </div>
        </div>
      </section>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Toque no <span className="font-bold text-success">+</span> para registrar seu primeiro
        lançamento.
      </p>
    </PageShell>
  );
}
