import { Link } from "@tanstack/react-router";
import { Plus, Sparkles, Wrench } from "lucide-react";

export function WelcomeCard({ name }: { name: string }) {
  return (
    <section
      aria-labelledby="welcome-title"
      className="mt-5 rounded-3xl border border-border bg-surface p-5"
    >
      <div className="flex items-center gap-2 text-success">
        <Sparkles className="size-5" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-wide">Conta criada</p>
      </div>
      <h2 id="welcome-title" className="mt-2 text-xl font-extrabold tracking-tight text-balance">
        {name ? `Boas-vindas, ${name}!` : "Boas-vindas!"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">
        Seu caixa começa zerado. Registre o primeiro lançamento ou cadastre seus próprios serviços
        e produtos para vender com um toque.
      </p>
      <ul className="mt-4 flex flex-col gap-2 text-sm">
        <li className="flex items-center gap-3 rounded-2xl bg-muted p-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-success text-success-foreground">
            <Plus className="size-5" aria-hidden="true" />
          </span>
          <span>
            Toque no botão <strong className="text-success">+</strong> para registrar uma entrada,
            saída ou retirada.
          </span>
        </li>
        <li>
          <Link
            to="/servicos"
            className="flex items-center gap-3 rounded-2xl bg-muted p-3 transition-colors hover:bg-secondary"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wrench className="size-4" aria-hidden="true" />
            </span>
            <span className="font-semibold text-primary">Cadastrar meus serviços e produtos</span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
