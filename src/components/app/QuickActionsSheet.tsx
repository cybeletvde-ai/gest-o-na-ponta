import { useEffect } from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, HandCoins } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { Kind } from "@/lib/finance/types";
import { EntradaForm } from "./forms/EntradaForm";
import { SaidaForm } from "./forms/SaidaForm";
import { RetiradaForm } from "./forms/RetiradaForm";
import { quickActions, useQuickActions } from "@/lib/ui/quick-actions";

const actions = [
  { kind: "entrada", label: "Registrar Entrada", hint: "Dinheiro que entrou", icon: ArrowDownLeft },
  { kind: "saida", label: "Registrar Saída", hint: "Dinheiro que saiu", icon: ArrowUpRight },
  { kind: "retirada", label: "Minha Retirada", hint: "Seu pró-labore", icon: HandCoins },
] as const;

const titles: Record<Kind, string> = {
  entrada: "Registrar Entrada",
  saida: "Registrar Saída",
  retirada: "Minha Retirada",
};

export function QuickActionsSheet() {
  const { open, mode, prefill, key } = useQuickActions();
  const setMode = quickActions.setMode;
  const onOpenChange = (o: boolean) => (o ? undefined : quickActions.close());

  useEffect(() => {
    if (open) return undefined;
    const t = setTimeout(quickActions.reset, 300);
    return () => clearTimeout(t);
  }, [open]);

  const close = quickActions.close;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent className="mx-auto max-h-[94dvh] max-w-md rounded-t-3xl border-none bg-surface">
        <DrawerHeader className="flex items-center gap-2 pt-3 pb-1 text-left">
          {mode && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Voltar"
              onClick={() => setMode(null)}
              className="-ml-2 rounded-full"
            >
              <ChevronLeft className="size-6" />
            </Button>
          )}
          <div className="grid gap-1">
            <DrawerTitle className="text-xl font-extrabold">
              {mode ? titles[mode] : "O que você quer registrar?"}
            </DrawerTitle>
            <DrawerDescription className={mode ? "sr-only" : undefined}>
              {mode ? "Preencha os dados abaixo." : "Escolha uma opção abaixo."}
            </DrawerDescription>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pt-1 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {mode === null && (
            <div className="flex flex-col gap-3">
              {actions.map(({ kind, label, hint, icon: Icon }) => (
                <Button key={kind} variant={kind} size="action" onClick={() => setMode(kind)}>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-surface/20">
                    <Icon />
                  </span>
                  <span className="flex flex-col items-start leading-tight">
                    <span>{label}</span>
                    <span className="text-xs font-medium opacity-80">{hint}</span>
                  </span>
                </Button>
              ))}
            </div>
          )}
          {mode === "entrada" && (
            <EntradaForm key={key} prefill={prefill} onDone={close} />
          )}
          {mode === "saida" && <SaidaForm onDone={close} />}
          {mode === "retirada" && <RetiradaForm onDone={close} />}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
