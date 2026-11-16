import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Settings } from "lucide-react";

import { PageShell } from "@/components/app/PageShell";
import { EmpresaForm } from "@/components/empresa/EmpresaForm";
import { useProfile } from "@/lib/finance/store";

export const Route = createFileRoute("/empresa")({
  head: () => ({
    meta: [
      { title: "Minha Empresa & Configurações — Meu Negócio no Azul" },
      {
        name: "description",
        content: "Dados do administrador, taxas da maquininha, dados fiscais e endereço da empresa.",
      },
    ],
  }),
  component: EmpresaPage,
});

function EmpresaPage() {
  const { profile, ready, isDemo } = useProfile();

  return (
    <PageShell
      title="Minha Empresa & Configurações"
      subtitle={profile.nomeFantasia || "Dados do seu negócio"}
      icon={Settings}
      action={
        <Link
          to="/"
          aria-label="Voltar para o Início"
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface text-primary transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="size-5" />
        </Link>
      }
    >
      {ready ? (
        <EmpresaForm initial={profile} isDemo={isDemo} />
      ) : (
        <p className="text-center text-sm text-muted-foreground" role="status">
          Carregando dados da empresa...
        </p>
      )}
    </PageShell>
  );
}
