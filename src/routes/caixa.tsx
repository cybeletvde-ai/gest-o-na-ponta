import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/app/PageShell";
import { LancamentoRow, detailOf, shortDate } from "@/components/app/LancamentoRow";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { financeActions, useFinance } from "@/lib/finance/store";
import { formatBRL, history, summarize, todayISO, upcoming } from "@/lib/finance/logic";
import type { Kind, Lancamento } from "@/lib/finance/types";

export const Route = createFileRoute("/caixa")({
  head: () => ({
    meta: [
      { title: "Caixa — Meu Caixa" },
      { name: "description", content: "Extrato do que já aconteceu e contas que vão acontecer." },
      { property: "og:title", content: "Caixa — Meu Caixa" },
      {
        property: "og:description",
        content: "Extrato do que já aconteceu e contas que vão acontecer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CaixaPage,
});

type Filter = "todos" | Kind;
const filters: { value: Filter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "entrada", label: "Entradas" },
  { value: "saida", label: "Saídas" },
  { value: "retirada", label: "Retiradas" },
];

function CaixaPage() {
  return (
    <PageShell title="Caixa" subtitle="Todas as entradas e saídas" icon={Wallet}>
      <Tabs defaultValue="feito">
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl p-1">
          <TabsTrigger value="feito" className="h-full rounded-xl text-sm font-bold">
            Já aconteceu
          </TabsTrigger>
          <TabsTrigger value="futuro" className="h-full rounded-xl text-sm font-bold">
            Vai acontecer
          </TabsTrigger>
        </TabsList>
        <TabsContent value="feito" className="mt-4">
          <JaAconteceu />
        </TabsContent>
        <TabsContent value="futuro" className="mt-4">
          <VaiAcontecer />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

function Empty({ children }: { children: string }) {
  return (
    <p className="rounded-3xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function JaAconteceu() {
  const { lancamentos } = useFinance();
  const [filter, setFilter] = useState<Filter>("todos");
  const [toDelete, setToDelete] = useState<Lancamento | null>(null);
  const items = history(lancamentos).filter((l) => filter === "todos" || l.kind === filter);

  return (
    <>
      <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1" role="group" aria-label="Filtros">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant="pill"
            size="pill"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>
      {items.length === 0 ? (
        <Empty>Nenhum lançamento aqui ainda.</Empty>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((l) => (
            <LancamentoRow
              key={l.id}
              item={l}
              subtitle={`${detailOf(l)} · ${shortDate(l.date)}`}
              action={
                <button
                  type="button"
                  aria-label={`Excluir ${l.description}`}
                  onClick={() => setToDelete(l)}
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              }
            />
          ))}
        </ul>
      )}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="max-w-sm rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && `${toDelete.description} · ${formatBRL(toDelete.amount)}`} será
              removido e o saldo será recalculado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (toDelete) {
                  financeActions.remove(toDelete.id);
                  toast("Lançamento excluído");
                }
                setToDelete(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function VaiAcontecer() {
  const { lancamentos } = useFinance();
  const s = summarize(lancamentos);
  const items = upcoming(lancamentos);
  const today = todayISO();

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-success/12 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-success">A Receber</p>
          <p className="mt-1 text-xl font-extrabold tabular-nums text-success">
            {formatBRL(s.aReceber)}
          </p>
        </div>
        <div className="rounded-2xl bg-destructive/12 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-destructive">A Pagar</p>
          <p className="mt-1 text-xl font-extrabold tabular-nums text-destructive">
            {formatBRL(s.aPagar)}
          </p>
        </div>
      </div>
      {items.length === 0 ? (
        <Empty>Nenhuma conta futura. Tudo em dia!</Empty>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((l) => {
            const late = l.date < today;
            const isIn = l.kind === "entrada";
            const when = `${isIn ? "Previsto" : "Vence"} ${shortDate(l.date)}`;
            return (
              <LancamentoRow
                key={l.id}
                item={l}
                subtitle={
                  <>
                    {late ? <span className="font-bold text-destructive">Atrasado · </span> : null}
                    {when}
                    {l.clientName ? ` · ${l.clientName}` : ""}
                  </>
                }
                action={
                  <Button
                    size="sm"
                    variant={isIn ? "quick-receive" : "quick-pay"}
                    className="h-7 px-3 text-xs font-bold"
                    onClick={() => {
                      financeActions.settle(l.id);
                      toast.success(isIn ? "Recebido!" : "Pago!", {
                        description: `${l.description} foi para "Já aconteceu".`,
                      });
                    }}
                  >
                    {isIn ? "Receber" : "Pagar"}
                  </Button>
                }
              />
            );
          })}
        </ul>
      )}
    </>
  );
}
