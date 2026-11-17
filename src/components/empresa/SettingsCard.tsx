import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function SettingsCard({
  id,
  icon: Icon,
  step,
  title,
  description,
  children,
}: {
  id: string;
  icon: LucideIcon;
  step: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="rounded-3xl border border-border bg-surface p-5">
      <header className="mb-4 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-success">
            Cartão {step}
          </p>
          <h2 id={id} className="text-base font-extrabold leading-tight">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground text-pretty">{description}</p>
        </div>
      </header>
      <div className="flex flex-col gap-3.5">{children}</div>
    </section>
  );
}
