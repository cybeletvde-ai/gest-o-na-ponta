import { Outlet, useRouterState } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";

import { AuthScreen } from "@/components/auth/AuthScreen";
import { BrandMark } from "@/components/auth/BrandMark";
import { useSession } from "@/lib/auth/session";
import { BottomNav } from "./BottomNav";

export function AppFrame() {
  const session = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname.startsWith("/auth/") || pathname === "/reset-password") return <Outlet />;

  if (session.status === "loading") {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center gap-3"
        aria-busy="true"
      >
        <BrandMark className="animate-pulse" />
        <p className="text-sm font-semibold text-muted-foreground">Carregando seu negócio...</p>
      </main>
    );
  }

  if (session.status === "signedOut") return <AuthScreen />;

  return (
    <>
      {session.status === "demo" && (
        <p
          role="status"
          className="flex items-center justify-center gap-2 bg-warning/20 px-4 py-2 text-center text-xs font-bold text-warning-foreground"
        >
          <FlaskConical className="size-4" aria-hidden="true" />
          Modo Demonstração: dados fictícios, nada é salvo.
        </p>
      )}
      <Outlet />
      <BottomNav />
    </>
  );
}
