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
    <div className="flex flex-col gap-2">
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
}: {
  value: number;
  onChange: (cents: number) => void;
  tone: "success" | "destructive" | "primary";
  id?: string;
}) {
  const toneClass = {
    success: "text-success focus-within:border-success",
    destructive: "text-destructive focus-within:border-destructive",
    primary: "text-primary focus-within:border-primary",
  }[tone];
  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-border bg-muted px-4 py-3 transition-colors",
        toneClass,
      )}
    >
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Valor (R$)
      </label>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        value={formatBRL(value)}
        onChange={(e) => onChange(digitsToCents(e.target.value))}
        className="mt-1 w-full bg-transparent text-4xl font-extrabold tracking-tight outline-none"
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
}: {
  options: { value: T; label: string; icon?: ReactNode }[];
  value: T | undefined;
  onChange: (v: T) => void;
  variant?: "choice" | "pill";
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(variant === "choice" ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-2")}
    >
      {options.map((o) => (
        <Button
          key={o.value}
          type="button"
          variant={variant}
          size={variant}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.icon}
          {o.label}
        </Button>
      ))}
    </div>
  );
}

export const inputClass = "h-12 rounded-xl bg-surface px-4 text-base";
