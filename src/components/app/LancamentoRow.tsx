import type { ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownLeft, ArrowUpRight, HandCoins } from "lucide-react";

import { formatBRL } from "@/lib/finance/logic";
import { CATEGORY_LABEL, METHOD_LABEL, type Lancamento } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

const kindStyle = {
  entrada: { icon: ArrowDownLeft, chip: "bg-success/12 text-success", amount: "text-success", sign: "+" },
  saida: { icon: ArrowUpRight, chip: "bg-destructive/12 text-destructive", amount: "text-destructive", sign: "−" },
  retirada: { icon: HandCoins, chip: "bg-primary/12 text-primary", amount: "text-primary", sign: "−" },
} as const;

export function shortDate(iso: string) {
  return format(parseISO(iso), "d MMM", { locale: ptBR });
}

export function detailOf(l: Lancamento) {
  if (l.kind === "saida") return l.category ? CATEGORY_LABEL[l.category] : "Saída";
  return l.method ? METHOD_LABEL[l.method] : "";
}

export function LancamentoRow({
  item,
  subtitle,
  action,
}: {
  item: Lancamento;
  subtitle: ReactNode;
  action?: ReactNode;
}) {
  const k = kindStyle[item.kind];
  const Icon = k.icon;
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-sm">
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", k.chip)}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{item.description}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={cn("text-sm font-extrabold tabular-nums", k.amount)}>
          {k.sign} {formatBRL(item.amount)}
        </span>
        {action}
      </div>
    </li>
  );
}
