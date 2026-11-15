import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";

import { PageShell } from "@/components/app/PageShell";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — Meu Caixa" },
      { name: "description", content: "Organize os serviços que você oferece." },
      { property: "og:title", content: "Serviços — Meu Caixa" },
      { property: "og:description", content: "Organize os serviços que você oferece." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServiosPage,
});

function ServiosPage() {
  return <PageShell title="Serviços" subtitle="Seus serviços e preços" icon={Wrench} />;
}
