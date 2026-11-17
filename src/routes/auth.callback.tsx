import { Navigate, createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

import { BrandMark } from "@/components/auth/BrandMark";
import { useSession } from "@/lib/auth/session";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ title: "Confirmando acesso — Meu Negócio no Azul" }] }),
  component: AuthCallback,
});

// O Supabase troca o ?code= pela sessão sozinho (detectSessionInUrl); aqui só esperamos.
function AuthCallback() {
  const session = useSession();
  const failed =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("error");

  if (session.status === "signedIn") return <Navigate to="/" replace />;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <BrandMark />
      {failed || session.status === "signedOut" ? (
        <>
          <h1 className="text-xl font-extrabold">Não foi possível confirmar</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            O link pode ter expirado ou já ter sido usado. Tente entrar com seu e-mail e senha.
          </p>
          <Link to="/" className="font-bold text-primary underline-offset-4 hover:underline">
            Ir para o acesso
          </Link>
        </>
      ) : (
        <p className="text-sm font-semibold text-muted-foreground" role="status">
          Confirmando seu acesso...
        </p>
      )}
    </main>
  );
}
