import { Link, createFileRoute } from "@tanstack/react-router";
import { Home, Settings } from "lucide-react";

import { PageShell } from "@/components/app/PageShell";
import { WelcomeCard } from "@/components/app/WelcomeCard";
import { useFinance, useProfile } from "@/lib/finance/store";
import { formatBRL, summarize } from "@/lib/finance/logic";
import { firstName } from "@/lib/business/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — Meu Negócio no Azul" },
      { name: "description", content: "Resumo do seu negócio: entradas, saídas e retiradas." },
      { property: "og:title", content: "Início — Meu Negócio no Azul" },
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

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function Index() {
  const { lancamentos, ready } = useFinance();
  const { profile } = useProfile();
  const s = summarize(lancamentos);
  const done = lancamentos.filter((l) => l.status === "done");
  const count = (k: string) => done.filter((l) => l.kind === k).length;
  const stats = [
    { label: "Entrou", value: s.entradas, hint: plural(count("entrada"), "entrada", "entradas") },
    { label: "Saiu", value: s.saidas, hint: plural(count("saida"), "saída", "saídas") },
    { label: "Retirei", value: s.retiradas, hint: plural(count("retirada"), "retirada", "retiradas") },
  ];
  const name = firstName(profile.adminName);

  return (
    <PageShell
      title={profile.nomeFantasia || "Meu Negócio"}
      subtitle={name ? `Olá, ${name}! Veja como está seu negócio hoje` : "Veja como está seu negócio hoje"}
      icon={Home}
      action={
        <Link
          to="/empresa"
          aria-label="Minha Empresa & Configurações"
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Settings className="size-5" />
        </Link>
      }
    >
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
              <p className="mt-0.5 text-[11px] opacity-70">{st.hint}</p>
            </div>
          ))}
        </div>
      </section>
      {ready && lancamentos.length === 0 && <WelcomeCard name={name} />}
    </PageShell>
  );
}
