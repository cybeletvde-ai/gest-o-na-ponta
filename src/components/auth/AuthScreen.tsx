import { useState } from "react";
import { MailCheck, PlayCircle } from "lucide-react";
import type { AuthError } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, inputClass } from "@/components/app/forms/fields";
import { authActions, useSession } from "@/lib/auth/session";
import { authRedirectUrl, getSupabase, resetRedirectUrl } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { BrandMark } from "./BrandMark";
import { PasswordInput } from "./PasswordInput";

type Tab = "entrar" | "criar";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mensagens que o usuário precisa ver, sem revelar se o e-mail existe. */
function friendlyError(error: AuthError, context: Tab): string {
  if (error.status === 429 || error.code === "over_request_rate_limit" || error.code === "over_email_send_rate_limit")
    return "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.";
  if (error.code === "email_not_confirmed")
    return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (error.code === "weak_password")
    return "Senha fraca. Use pelo menos 6 caracteres, misturando letras e números.";
  if (error.code === "email_address_invalid") return "Esse e-mail não é válido.";
  if (context === "entrar" && (error.code === "invalid_credentials" || error.status === 400))
    return "E-mail ou senha incorretos.";
  return "Algo deu errado. Tente novamente em instantes.";
}

export function AuthScreen() {
  const [tab, setTab] = useState<Tab>("entrar");
  const session = useSession();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-10">
      <header className="flex flex-col items-center gap-3 text-center">
        <BrandMark />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary text-balance">
            Meu Negócio no Azul
          </h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Controle de entradas, saídas e lucro para qualquer profissional ou comércio.
          </p>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Acesso"
        className="mt-8 grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1"
      >
        {(
          [
            { id: "entrar", label: "Entrar" },
            { id: "criar", label: "Criar Conta Grátis" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "h-11 rounded-xl text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              tab === t.id
                ? "bg-surface text-primary shadow-action"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="mt-4 rounded-3xl border border-border bg-surface p-5"
      >
        {tab === "entrar" ? <LoginForm /> : <SignUpForm onGoToLogin={() => setTab("entrar")} />}
      </section>

      {session.error && (
        <p role="alert" className="mt-4 text-center text-xs font-semibold text-destructive">
          {session.error}
        </p>
      )}
    </main>
  );
}

function LoginForm() {
  const [forgot, setForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) return setError("Digite um e-mail válido.");
    if (!password) return setError("Digite sua senha.");
    setLoading(true);
    try {
      const { error: err } = await getSupabase().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) setError(friendlyError(err, "entrar"));
    } catch {
      setError("Não foi possível conectar. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  }

  if (forgot) return <ForgotForm initialEmail={email} onBack={() => setForgot(false)} />;

  return (
    <form
      className="flex flex-col gap-3.5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <Field label="E-mail" htmlFor="login-email">
        <Input
          id="login-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className={inputClass}
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Senha" htmlFor="login-password">
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
        />
      </Field>
      <button
        type="button"
        onClick={() => setForgot(true)}
        className="-mt-1 self-end text-sm font-bold text-primary underline-offset-4 hover:underline"
      >
        Esqueci minha senha
      </button>
      {error && (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" variant="entrada" size="submit" disabled={loading}>
        {loading ? "Entrando..." : "Acessar Meu Negócio"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="h-11 rounded-xl text-sm font-semibold text-muted-foreground hover:text-primary"
        onClick={() => authActions.enterDemo()}
      >
        <PlayCircle />
        Entrar no Modo Demonstração
      </Button>
    </form>
  );
}

function SignUpForm({ onGoToLogin }: { onGoToLogin: () => void }) {
  const [adminName, setAdminName] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!adminName.trim()) return setError("Digite seu nome.");
    if (!nomeFantasia.trim()) return setError("Digite o nome do seu negócio.");
    if (!EMAIL_RE.test(email.trim())) return setError("Digite um e-mail válido.");
    if (password.length < 6) return setError("A senha precisa ter pelo menos 6 caracteres.");
    setLoading(true);
    try {
      const { data, error: err } = await getSupabase().auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: authRedirectUrl(),
          data: { admin_name: adminName.trim(), nome_fantasia: nomeFantasia.trim() },
        },
      });
      if (err) setError(friendlyError(err, "criar"));
      else if (!data.session) setSentTo(email.trim());
    } catch {
      setError("Não foi possível conectar. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center" role="status">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-success/15 text-success">
          <MailCheck className="size-6" />
        </span>
        <h2 className="text-lg font-extrabold">Confirme seu e-mail</h2>
        <p className="text-sm text-muted-foreground text-pretty">
          Enviamos um link para <strong className="text-foreground">{sentTo}</strong>. Toque nele
          para ativar sua conta e começar.
        </p>
        <Button variant="outline" className="mt-2 h-11 rounded-xl" onClick={onGoToLogin}>
          Já confirmei, quero entrar
        </Button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3.5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <Field label="Seu Nome (Administrador)" htmlFor="signup-name">
        <Input
          id="signup-name"
          autoComplete="name"
          className={inputClass}
          placeholder="Ex: Ana Souza"
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
        />
      </Field>
      <Field label="Nome do Negócio (Nome Fantasia)" htmlFor="signup-business">
        <Input
          id="signup-business"
          autoComplete="organization"
          className={inputClass}
          placeholder="Ex: Souza Serviços"
          value={nomeFantasia}
          onChange={(e) => setNomeFantasia(e.target.value)}
        />
      </Field>
      <Field label="E-mail" htmlFor="signup-email">
        <Input
          id="signup-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className={inputClass}
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Senha" htmlFor="signup-password">
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
        />
      </Field>
      {error && (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" variant="entrada" size="submit" disabled={loading}>
        {loading ? "Criando conta..." : "Criar Conta e Começar"}
      </Button>
    </form>
  );
}

function ForgotForm({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) return setError("Digite um e-mail válido.");
    setLoading(true);
    try {
      const { error: err } = await getSupabase().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: resetRedirectUrl(),
      });
      if (err && (err.status === 429 || err.code === "over_email_send_rate_limit"))
        setError("Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.");
      else setSent(true);
    } catch {
      setError("Não foi possível conectar. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center" role="status">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-success/15 text-success">
          <MailCheck className="size-6" />
        </span>
        <h2 className="text-lg font-extrabold">Verifique seu e-mail</h2>
        <p className="text-sm text-muted-foreground text-pretty">
          Se existir uma conta com <strong className="text-foreground">{email.trim()}</strong>,
          enviamos um link para você criar uma nova senha.
        </p>
        <Button variant="outline" className="mt-2 h-11 rounded-xl" onClick={onBack}>
          Voltar para Entrar
        </Button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3.5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div>
        <h2 className="text-lg font-extrabold">Esqueci minha senha</h2>
        <p className="text-sm text-muted-foreground text-pretty">
          Digite seu e-mail e enviaremos um link para criar uma nova senha.
        </p>
      </div>
      <Field label="E-mail" htmlFor="forgot-email">
        <Input
          id="forgot-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className={inputClass}
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      {error && (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" variant="entrada" size="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar link"}
      </Button>
      <Button type="button" variant="ghost" className="h-11 rounded-xl font-semibold" onClick={onBack}>
        Voltar para Entrar
      </Button>
    </form>
  );
}
