import { useState } from "react";
import { Banknote, CalendarClock, CheckCircle2, CreditCard, QrCode, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { financeActions, useFinance } from "@/lib/finance/store";
import { formatBRL, todayISO } from "@/lib/finance/logic";
import type { Method } from "@/lib/finance/types";
import { AmountInput, ChoiceGroup, Field, inputClass } from "./fields";

type Errors = Partial<Record<"amount" | "description" | "date" | "clientName", string>>;

const methods = [
  { value: "pix" as const, label: "Pix", icon: <QrCode /> },
  { value: "dinheiro" as const, label: "Dinheiro", icon: <Banknote /> },
  { value: "credito" as const, label: "Crédito", icon: <CreditCard /> },
  { value: "debito" as const, label: "Débito", icon: <Wallet /> },
];

export function EntradaForm({ onDone }: { onDone: () => void }) {
  const { servicos } = useFinance();
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState<Method>("pix");
  const [status, setStatus] = useState<"done" | "pending">("done");
  const [date, setDate] = useState("");
  const [clientName, setClientName] = useState("");
  const [errors, setErrors] = useState<Errors>({});

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
      className="flex flex-col gap-5"
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
          placeholder="Ex: Corte, Escova, Banho e Tosa"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {servicos.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Serviços cadastrados">
            {servicos.map((s) => (
              <Button
                key={s.id}
                type="button"
                variant="pill"
                size="pill"
                aria-pressed={description === s.name}
                onClick={() => {
                  setDescription(s.name);
                  if (s.price && amount === 0) setAmount(s.price);
                }}
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
        <div className="flex flex-col gap-4 rounded-2xl bg-muted p-4">
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
