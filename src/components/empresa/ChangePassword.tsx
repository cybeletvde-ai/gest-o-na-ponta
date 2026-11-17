import { useState } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/app/forms/fields";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { getSupabase } from "@/lib/supabase/client";

/** Troca de senha com a conta já aberta: pede a senha atual. Fica fora do <form> da empresa. */
export function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setError(null);
    setDone(false);
    if (!current) return setError("Digite sua senha atual.");
    if (next.length < 6) return setError("A nova senha precisa ter pelo menos 6 caracteres.");
    setLoading(true);
    const { error: err } = await getSupabase().auth.updateUser({
      password: next,
      current_password: current,
    });
    setLoading(false);
    if (err) {
      setError(
        err.code === "same_password"
          ? "A nova senha precisa ser diferente da atual."
          : err.code === "weak_password"
            ? "Senha fraca. Use pelo menos 6 caracteres, misturando letras e números."
            : err.code === "current_password_mismatch" || err.status === 400 || err.status === 401
              ? "Senha atual incorreta."
              : "Não foi possível trocar a senha. Tente novamente.",
      );
      return;
    }
    setCurrent("");
    setNext("");
    setDone(true);
    setOpen(false);
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl font-bold text-primary"
          onClick={() => {
            setOpen(true);
            setDone(false);
          }}
        >
          <KeyRound />
          Alterar senha
        </Button>
        {done && (
          <p role="status" className="flex items-center gap-1.5 text-sm font-bold text-success">
            <CheckCircle2 className="size-4" /> Senha alterada com sucesso!
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted p-4">
      <Field label="Senha atual" htmlFor="pwd-current">
        <PasswordInput
          id="pwd-current"
          autoComplete="current-password"
          value={current}
          onChange={setCurrent}
        />
      </Field>
      <Field label="Nova senha" htmlFor="pwd-new">
        <PasswordInput id="pwd-new" autoComplete="new-password" value={next} onChange={setNext} />
      </Field>
      {error && (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="ghost"
          className="h-11 rounded-xl font-semibold"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="entrada"
          className="h-11 rounded-xl font-bold"
          disabled={loading}
          onClick={() => void submit()}
        >
          {loading ? "Salvando..." : "Salvar senha"}
        </Button>
      </div>
    </div>
  );
}
