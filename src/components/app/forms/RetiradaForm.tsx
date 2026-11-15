import { useState } from "react";
import { Banknote, QrCode } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { financeActions } from "@/lib/finance/store";
import { formatBRL, todayISO } from "@/lib/finance/logic";
import { AmountInput, ChoiceGroup, Field, inputClass } from "./fields";

const DEFAULT_RETIRADA = "Retirada Pessoal / Pró-labore";

export function RetiradaForm({ onDone }: { onDone: () => void }) {
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState(DEFAULT_RETIRADA);
  const [method, setMethod] = useState<"pix" | "dinheiro">("pix");
  const [error, setError] = useState("");

  function submit() {
    if (amount <= 0) {
      setError("Informe o valor.");
      return;
    }
    financeActions.add({
      kind: "retirada",
      amount,
      description: description.trim() || DEFAULT_RETIRADA,
      method,
      status: "done",
      date: todayISO(),
    });
    toast.success("Retirada confirmada!", { description: formatBRL(amount) });
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
        <AmountInput value={amount} onChange={setAmount} tone="primary" />
        {error && <p className="mt-2 text-xs font-semibold text-destructive">{error}</p>}
      </div>
      <Field label="Descrição" htmlFor="desc-retirada">
        <Input
          id="desc-retirada"
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <Field label="Forma">
        <ChoiceGroup
          label="Forma"
          value={method}
          onChange={setMethod}
          options={[
            { value: "pix", label: "Pix", icon: <QrCode /> },
            { value: "dinheiro", label: "Dinheiro", icon: <Banknote /> },
          ]}
        />
      </Field>
      <Button type="submit" variant="retirada" size="submit">
        Confirmar Retirada
      </Button>
    </form>
  );
}
