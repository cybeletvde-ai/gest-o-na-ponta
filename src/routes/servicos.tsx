import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Search, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/app/PageShell";
import { ItemFormSheet } from "@/components/app/ItemFormSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { financeActions, useFinance } from "@/lib/finance/store";
import { formatBRL, profitOf, saleDescription, searchItems } from "@/lib/finance/logic";
import { ITEM_TYPE_LABEL, type ItemType, type Servico } from "@/lib/finance/types";
import { quickActions } from "@/lib/ui/quick-actions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços e Produtos — Meu Caixa" },
      {
        name: "description",
        content: "Cadastre serviços e produtos com código, preço, custo e lucro por venda.",
      },
      { property: "og:title", content: "Serviços e Produtos — Meu Caixa" },
      {
        property: "og:description",
        content: "Cadastre serviços e produtos com código, preço, custo e lucro por venda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicosPage,
});

type Filter = "todos" | ItemType;
const filters: { value: Filter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "servico", label: "Serviços" },
  { value: "produto", label: "Produtos" },
];

function ServicosPage() {
  const { servicos, ready } = useFinance();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Servico | null>(null);
  const [toDelete, setToDelete] = useState<Servico | null>(null);
  const items = searchItems(servicos, query, filter);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <PageShell
      title="Serviços"
      subtitle="Seu catálogo e preços"
      icon={Wrench}
      action={
        <Button variant="retirada" className="h-10 shrink-0 rounded-xl px-3 font-bold" onClick={openNew}>
          <Plus strokeWidth={3} />
          Novo Item
        </Button>
      }
    >
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Buscar por nome ou código"
          placeholder="Buscar por nome ou código"
          className="h-12 rounded-2xl bg-surface pl-11 text-base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mb-4 flex gap-2" role="group" aria-label="Filtros">
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

      {ready && items.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          {servicos.length === 0
            ? "Nenhum item cadastrado. Toque em “Novo Item” para começar."
            : "Nenhum item encontrado."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={() => {
                setEditing(item);
                setFormOpen(true);
              }}
              onDelete={() => setToDelete(item)}
            />
          ))}
        </ul>
      )}

      <ItemFormSheet open={formOpen} onOpenChange={setFormOpen} item={editing} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="max-w-sm rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && `${saleDescription(toDelete)}`} sai do seu catálogo. Os lançamentos já
              feitos continuam no Caixa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (toDelete) {
                  financeActions.removeItem(toDelete.id);
                  toast("Item excluído");
                }
                setToDelete(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function ItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: Servico;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const profit = profitOf(item);
  const iconBtn =
    "rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-border/60">
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-muted-foreground">
            #{item.sku}
          </span>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-bold",
              item.type === "servico" ? "bg-secondary text-primary" : "bg-accent text-accent-foreground",
            )}
          >
            {ITEM_TYPE_LABEL[item.type]}
          </span>
          <span className="ml-auto flex items-center">
            <button type="button" aria-label={`Editar ${item.name}`} onClick={onEdit} className={iconBtn}>
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Excluir ${item.name}`}
              onClick={onDelete}
              className={cn(iconBtn, "hover:bg-destructive/10 hover:text-destructive")}
            >
              <Trash2 className="size-3.5" />
            </button>
          </span>
        </div>
        <p className="truncate text-base font-extrabold leading-tight">{item.name}</p>
        <p className="text-lg font-extrabold text-primary">{formatBRL(item.price)}</p>
        {profit !== undefined && item.cost !== undefined && (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Custo: {formatBRL(item.cost)}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-bold",
                profit < 0 ? "bg-destructive/12 text-destructive" : "bg-success/12 text-success",
              )}
            >
              Lucro: {formatBRL(profit)}
            </span>
          </div>
        )}
      </div>
      <Button
        variant="quick-receive"
        className="h-11 shrink-0 px-5 text-sm font-extrabold"
        onClick={() =>
          quickActions.sell({ amount: item.price, description: saleDescription(item) })
        }
      >
        Vender
      </Button>
    </li>
  );
}
