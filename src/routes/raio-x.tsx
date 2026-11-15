import { createFileRoute } from "@tanstack/react-router";
import { ScanLine } from "lucide-react";

import { PageShell } from "@/components/app/PageShell";

export const Route = createFileRoute("/raio-x")({
  head: () => ({
    meta: [
      { title: "Raio-X — Meu Caixa" },
      { name: "description", content: "Entenda para onde vai o seu dinheiro." },
      { property: "og:title", content: "Raio-X — Meu Caixa" },
      { property: "og:description", content: "Entenda para onde vai o seu dinheiro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RaioXPage,
});

function RaioXPage() {
  return <PageShell title="Raio-X" subtitle="A saúde do seu negócio" icon={ScanLine} />;
}
