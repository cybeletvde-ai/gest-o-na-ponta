import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";

import { PageShell } from "@/components/app/PageShell";

export const Route = createFileRoute("/caixa")({
  head: () => ({
    meta: [
      { title: "Caixa — Meu Caixa" },
      { name: "description", content: "Acompanhe cada entrada e saída do seu caixa." },
      { property: "og:title", content: "Caixa — Meu Caixa" },
      { property: "og:description", content: "Acompanhe cada entrada e saída do seu caixa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CaixaPage,
});

function CaixaPage() {
  return <PageShell title="Caixa" subtitle="Todas as entradas e saídas" icon={Wallet} />;
}
