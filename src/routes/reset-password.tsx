import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { BrandMark } from "@/components/auth/BrandMark";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Field } from "@/components/app/forms/fields";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/session";
import { getSupabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Criar nova senha — Meu Negócio no Azul" },
      { name: "description", content: "Defina uma nova senha para acessar seu negócio." },
      { property: "og:title", content: "Criar nova senha — Meu Negócio no Azul" },
      { property: "og:description", content: "Defina uma nova senha para acessar seu negócio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const session = useSession();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setError(null);
    if (password.length < 6) return setError("A senha precisa ter pelo menos 6 caracteres.");
    if (password !== confirm) return setError("As duas senhas não são iguais.");
    setLoading(true);
    const { error: err } = await getSupabase().auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(
        err.code === "same_password"
          ? "A nova senha precisa ser diferente da anterior."
          : err.code === "weak_password"
            ? "Senha fraca. Use pelo menos 6 caracteres, misturando letras e números."
            : "Não foi possível trocar a senha. Peça um novo link e tente de novo.",
      );
      return;
    }
    setDone(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-5 py-10">
      <BrandMark />
      <section className="w-full rounded-3xl border border-border bg-surface p-5">
        {done ? (
          <div className="flex flex-col items-center gap-3 text-center" role="status">
            <CheckCircle2 className="size-10 text-success" />
            <h1 className="text-lg font-extrabold">Senha alterada!</h1>
            <Button
              variant="entrada"
              size="submit"
              className="w-full"
              onClick={() => navigate({ to: "/", replace: true })}
            >
              Acessar Meu Negócio
            </Button>
          </div>
        ) : session.status === "loading" ? (
          <p className="text-center text-sm font-semibold text-muted-foreground" role="status">
            Verificando seu link...
          </p>
        ) : session.status !== "signedIn" ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-lg font-extrabold">Link inválido ou expirado</h1>
            <p className="text-sm text-muted-foreground text-pretty">
              Volte para a tela de acesso e toque em "Esqueci minha senha" para receber um novo link.
            </p>
            <Link to="/" className="font-bold text-primary underline-offset-4 hover:underline">
              Ir para o acesso
            </Link>
          </div>
        ) : (
          <form
            className="flex flex-col gap-3.5"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <h1 className="text-lg font-extrabold">Criar nova senha</h1>
            <Field label="Nova senha" htmlFor="new-password">
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
              />
            </Field>
            <Field label="Repita a nova senha" htmlFor="confirm-password">
              <PasswordInput
                id="confirm-password"
                autoComplete="new-password"
                value={confirm}
                onChange={setConfirm}
              />
            </Field>
            {error && (
              <p role="alert" className="text-sm font-semibold text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" variant="entrada" size="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
