import type { ReactNode } from "react";
import { digitsToCents, formatBRL } from "@/lib/finance/logic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      {children}
      {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
    </div>
  );
}

export function AmountInput({
  value,
  onChange,
  tone,
  id = "valor",
  label = "Valor (R$)",
  size = "lg",
}: {
  value: number;
  onChange: (cents: number) => void;
  tone: "success" | "destructive" | "primary";
  id?: string;
  label?: string;
  size?: "lg" | "md";
}) {
  const toneClass = {
    success: "text-success focus-within:border-success",
    destructive: "text-destructive focus-within:border-destructive",
    primary: "text-primary focus-within:border-primary",
  }[tone];
  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-border bg-muted px-4 py-2 transition-colors",
        toneClass,
      )}
    >
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        value={formatBRL(value)}
        onChange={(e) => onChange(digitsToCents(e.target.value))}
        className={cn(
          "w-full bg-transparent font-extrabold tracking-tight outline-none",
          size === "lg" ? "text-3xl" : "text-xl",
        )}
      />
    </div>
  );
}

export function ChoiceGroup<T extends string>({
  options,
  value,
  onChange,
  variant = "choice",
  label,
  columns = 2,
}: {
  options: { value: T; label: string; icon?: ReactNode }[];
  value: T | undefined;
  onChange: (v: T) => void;
  variant?: "choice" | "pill";
  label: string;
  columns?: 2 | 4;
}) {
  const stacked = variant === "choice" && columns === 4;
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        variant === "choice"
          ? cn("grid gap-2", columns === 4 ? "grid-cols-4" : "grid-cols-2")
          : "flex flex-wrap gap-2",
      )}
    >
      {options.map((o) => (
        <Button
          key={o.value}
          type="button"
          variant={variant}
          size={variant}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={stacked ? "h-14 flex-col gap-1 px-1 text-xs" : undefined}
        >
          {o.icon}
          {o.label}
        </Button>
      ))}
    </div>
  );
}

export const inputClass = "h-11 rounded-xl bg-surface px-4 text-base";
