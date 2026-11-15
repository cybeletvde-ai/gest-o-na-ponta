import { ArrowDownLeft, ArrowUpRight, HandCoins } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

const actions = [
  { label: "Registrar Entrada", hint: "Dinheiro que entrou", variant: "entrada", icon: ArrowDownLeft },
  { label: "Registrar Saída", hint: "Dinheiro que saiu", variant: "saida", icon: ArrowUpRight },
  { label: "Minha Retirada", hint: "Seu pró-labore", variant: "retirada", icon: HandCoins },
] as const;

export function QuickActionsSheet({ open, onOpenChange }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent className="mx-auto max-w-md rounded-t-3xl border-none bg-surface">
        <DrawerHeader className="pb-2 text-left">
          <DrawerTitle className="text-xl font-extrabold">O que você quer registrar?</DrawerTitle>
          <DrawerDescription>Escolha uma opção abaixo.</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-3 px-4 pt-2 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          {actions.map(({ label, hint, variant, icon: Icon }) => (
            <Button
              key={label}
              variant={variant}
              size="action"
              onClick={() => {
                onOpenChange(false);
                toast(label, { description: "Em breve você poderá preencher os detalhes aqui." });
              }}
            >
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
      </DrawerContent>
    </Drawer>
  );
}
