import { useState } from "react";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { financeActions } from "@/lib/finance/store";
import { formatBRL, todayISO } from "@/lib/finance/logic";
import { CATEGORY_LABEL, type Category } from "@/lib/finance/types";
import { AmountInput, ChoiceGroup, Field, inputClass } from "./fields";

type Errors = Partial<Record<"amount" | "description" | "category" | "date", string>>;

const categories = (Object.keys(CATEGORY_LABEL) as Category[]).map((c) => ({
  value: c,
  label: CATEGORY_LABEL[c],
}));

export function SaidaForm({ onDone }: { onDone: () => void }) {
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category | undefined>();
  const [status, setStatus] = useState<"done" | "pending">("done");
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  function submit() {
    const e: Errors = {};
    if (amount <= 0) e.amount = "Informe o valor.";
    if (!description.trim()) e.description = "Diga com o que foi o gasto.";
    if (!category) e.category = "Escolha uma categoria.";
    if (status === "pending" && !date) e.date = "Informe a data de vencimento.";
    setErrors(e);
    if (Object.keys(e).length) return;
    financeActions.add({
      kind: "saida",
      amount,
      description: description.trim(),
      category,
      status,
      date: status === "done" ? todayISO() : date,
    });
    toast.success(status === "done" ? "Saída salva!" : "Conta agendada!", {
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
        <AmountInput value={amount} onChange={setAmount} tone="destructive" />
        {errors.amount && (
          <p className="mt-2 text-xs font-semibold text-destructive">{errors.amount}</p>
        )}
      </div>

      <Field label="Descrição" htmlFor="desc-saida" error={errors.description}>
        <Input
          id="desc-saida"
          className={inputClass}
          placeholder="Ex: Aluguel, materiais, combustível, conta de luz"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <Field label="Categoria" error={errors.category}>
        <ChoiceGroup
          label="Categoria"
          variant="pill"
          options={categories}
          value={category}
          onChange={setCategory}
        />
      </Field>

      <Field label="Status">
        <ChoiceGroup
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "done", label: "Já paguei (Hoje)", icon: <CheckCircle2 /> },
            { value: "pending", label: "Vou pagar depois", icon: <CalendarClock /> },
          ]}
        />
      </Field>

      {status === "pending" && (
        <div className="rounded-2xl bg-muted p-3">
          <Field label="Data de vencimento" htmlFor="venc" error={errors.date}>
            <Input
              id="venc"
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
        </div>
      )}

      <Button type="submit" variant="saida" size="submit">
        Salvar Saída
      </Button>
    </form>
  );
}
