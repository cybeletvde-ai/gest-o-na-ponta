import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function PageShell({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(9rem+env(safe-area-inset-bottom))]">
      <header className="mb-6 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Icon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {action}
      </header>
      {children ?? (
        <div className="rounded-3xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          Nada por aqui ainda. Toque no <span className="font-bold text-success">+</span> para
          começar.
        </div>
      )}
    </main>
  );
}
