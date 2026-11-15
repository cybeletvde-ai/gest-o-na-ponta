import { useState } from "react";
import { Package, Scissors } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { financeActions, useFinance } from "@/lib/finance/store";
import { formatBRL, nextSku, normalizeSku, skuTaken } from "@/lib/finance/logic";
import type { ItemType, Servico } from "@/lib/finance/types";
import { cn } from "@/lib/utils";
import { AmountInput, ChoiceGroup, Field, inputClass } from "./forms/fields";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Item sendo editado; vazio = novo item. */
  item: Servico | null;
};

export function ItemFormSheet({ open, onOpenChange, item }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent className="mx-auto max-h-[94dvh] max-w-md rounded-t-3xl border-none bg-surface">
        <DrawerHeader className="pt-3 pb-1 text-left">
          <DrawerTitle className="text-xl font-extrabold">
            {item ? "Editar Item" : "Novo Item"}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Cadastre um serviço ou produto com código, preço e custo.
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pt-1 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {open && (
            <ItemForm key={item?.id ?? "novo"} item={item} onDone={() => onOpenChange(false)} />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

type Errors = Partial<Record<"sku" | "name" | "price", string>>;

function ItemForm({ item, onDone }: { item: Servico | null; onDone: () => void }) {
  const { servicos } = useFinance();
  const [type, setType] = useState<ItemType>(item?.type ?? "servico");
  const [sku, setSku] = useState(item?.sku ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item?.price ?? 0);
  const [cost, setCost] = useState(item?.cost ?? 0);
  const [errors, setErrors] = useState<Errors>({});
  const profit = price - cost;

  function submit() {
    const e: Errors = {};
    if (!name.trim()) e.name = "Informe o nome do item.";
    if (price <= 0) e.price = "Informe o preço de venda.";
    if (normalizeSku(sku) && skuTaken(servicos, sku, item?.id))
      e.sku = "Já existe um item com esse código.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const saved = financeActions.saveItem({
      id: item?.id,
      type,
      sku,
      name: name.trim(),
      price,
      cost: cost > 0 ? cost : undefined,
    });
    toast.success(item ? "Item atualizado!" : "Item salvo!", {
      description: `#${saved} · ${name.trim()} · ${formatBRL(price)}`,
    });
    onDone();
  }

  return (
    <form
      className="flex flex-col gap-3.5"
      onSubmit={(ev) => {
        ev.preventDefault();
        submit();
      }}
    >
      <Field label="Tipo">
        <ChoiceGroup
          label="Tipo"
          value={type}
          onChange={setType}
          options={[
            { value: "servico", label: "Serviço", icon: <Scissors /> },
            { value: "produto", label: "Produto", icon: <Package /> },
          ]}
        />
      </Field>

      <Field label="Código / SKU (opcional)" htmlFor="sku" error={errors.sku}>
        <Input
          id="sku"
          className={cn(inputClass, "uppercase placeholder:normal-case")}
          autoComplete="off"
          placeholder="Ex: 01, CORT01 (ou deixe vazio para gerar automático)"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
        />
        {!normalizeSku(sku) && !item && (
          <p className="text-xs text-muted-foreground">
            Código automático: <span className="font-bold">#{nextSku(servicos)}</span>
          </p>
        )}
      </Field>

      <Field label="Nome" htmlFor="nome-item" error={errors.name}>
        <Input
          id="nome-item"
          className={inputClass}
          placeholder="Ex: Corte Degradê, Pomada Modeladora"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <AmountInput
            id="preco"
            label="Preço de Venda (R$)"
            size="md"
            tone="primary"
            value={price}
            onChange={setPrice}
          />
          {errors.price && (
            <p className="mt-1.5 text-xs font-semibold text-destructive">{errors.price}</p>
          )}
        </div>
        <AmountInput
          id="custo"
          label="Custo / Comissão"
          size="md"
          tone="destructive"
          value={cost}
          onChange={setCost}
        />
      </div>

      <p
        aria-live="polite"
        className={cn(
          "rounded-xl px-4 py-2.5 text-sm font-bold",
          profit < 0 ? "bg-destructive/12 text-destructive" : "bg-success/12 text-success",
        )}
      >
        Lucro livre por venda: {formatBRL(profit)}
      </p>

      <Button type="submit" variant="retirada" size="submit">
        Salvar Item
      </Button>
    </form>
  );
}
