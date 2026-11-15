import { useState } from "react";
import { Banknote, CalendarClock, CheckCircle2, CreditCard, QrCode, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { financeActions, useFinance } from "@/lib/finance/store";
import {
  formatBRL,
  normalizeSku,
  saleDescription,
  searchItems,
  todayISO,
} from "@/lib/finance/logic";
import type { Method, Servico } from "@/lib/finance/types";
import type { EntradaPrefill } from "@/lib/ui/quick-actions";
import { AmountInput, ChoiceGroup, Field, inputClass } from "./fields";

type Errors = Partial<Record<"amount" | "description" | "date" | "clientName", string>>;

const methods = [
  { value: "pix" as const, label: "Pix", icon: <QrCode /> },
  { value: "dinheiro" as const, label: "Dinheiro", icon: <Banknote /> },
  { value: "credito" as const, label: "Crédito", icon: <CreditCard /> },
  { value: "debito" as const, label: "Débito", icon: <Wallet /> },
];

export function EntradaForm({
  onDone,
  prefill,
}: {
  onDone: () => void;
  prefill?: EntradaPrefill | null;
}) {
  const { servicos } = useFinance();
  const [amount, setAmount] = useState(prefill?.amount ?? 0);
  const [description, setDescription] = useState(prefill?.description ?? "");
  const [typing, setTyping] = useState(false);
  const [method, setMethod] = useState<Method>("pix");
  const [status, setStatus] = useState<"done" | "pending">("done");
  const [date, setDate] = useState("");
  const [clientName, setClientName] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const picked = servicos.find((s) => saleDescription(s) === description);
  const suggestions =
    typing && description.trim() && !picked ? searchItems(servicos, description).slice(0, 4) : [];

  function pick(item: Servico) {
    setDescription(saleDescription(item));
    setAmount(item.price);
    setTyping(false);
  }

  function onType(text: string) {
    // Digitou o código exato (ex: 001 ou #POM01)? Preenche na hora.
    const exact = normalizeSku(text) && servicos.find((s) => s.sku === normalizeSku(text));
    if (exact) return pick(exact);
    setDescription(text);
    setTyping(true);
  }

  function submit() {
    const e: Errors = {};
    if (amount <= 0) e.amount = "Informe o valor.";
    if (!description.trim()) e.description = "Diga o que foi vendido ou feito.";
    if (status === "pending") {
      if (!date) e.date = "Informe a data prevista.";
      if (!clientName.trim()) e.clientName = "Informe o nome do cliente.";
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    financeActions.add({
      kind: "entrada",
      amount,
      description: description.trim(),
      method,
      status,
      date: status === "done" ? todayISO() : date,
      clientName: status === "pending" ? clientName.trim() : undefined,
    });
    toast.success(status === "done" ? "Entrada salva!" : "Entrada agendada!", {
      description: `${description.trim()} · ${formatBRL(amount)}`,
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
      <div>
        <AmountInput value={amount} onChange={setAmount} tone="success" />
        {errors.amount && (
          <p className="mt-2 text-xs font-semibold text-destructive">{errors.amount}</p>
        )}
      </div>

      <Field label="Descrição ou Serviço" htmlFor="desc-entrada" error={errors.description}>
        <Input
          id="desc-entrada"
          className={inputClass}
          placeholder="Digite o nome ou código (ex: 001)"
          autoComplete="off"
          value={description}
          onChange={(e) => onType(e.target.value)}
        />
        {suggestions.length > 0 && (
          <ul
            aria-label="Sugestões"
            className="overflow-hidden rounded-xl border border-border bg-surface shadow-action"
          >
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => pick(s)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
                >
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground">
                    #{s.sku}
                  </span>
                  <span className="flex-1 truncate font-semibold">{s.name}</span>
                  <span className="font-bold text-success">{formatBRL(s.price)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {servicos.length > 0 && (
          <div
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5"
            role="group"
            aria-label="Itens cadastrados"
          >
            {servicos.map((s) => (
              <Button
                key={s.id}
                type="button"
                variant="pill"
                size="pill"
                className="h-8 shrink-0 px-3 text-xs"
                aria-pressed={picked?.id === s.id}
                onClick={() => pick(s)}
              >
                {s.name}
              </Button>
            ))}
          </div>
        )}
      </Field>

      <Field label="Forma de pagamento">
        <ChoiceGroup
          label="Forma de pagamento"
          options={methods}
          columns={4}
          value={method}
          onChange={setMethod}
        />
      </Field>

      <Field label="Status">
        <ChoiceGroup
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "done", label: "Já recebi (Hoje)", icon: <CheckCircle2 /> },
            { value: "pending", label: "Vou receber depois", icon: <CalendarClock /> },
          ]}
        />
      </Field>

      {status === "pending" && (
        <div className="flex flex-col gap-3 rounded-2xl bg-muted p-3">
          <Field label="Data prevista" htmlFor="data-entrada" error={errors.date}>
            <Input
              id="data-entrada"
              type="date"
              min={todayISO()}
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Nome do cliente" htmlFor="cliente" error={errors.clientName}>
            <Input
              id="cliente"
              className={inputClass}
              placeholder="Ex: Maria"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </Field>
        </div>
      )}

      <Button type="submit" variant="entrada" size="submit">
        Salvar Entrada
      </Button>
    </form>
  );
}
