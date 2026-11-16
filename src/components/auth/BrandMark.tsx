import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-16 items-center justify-center rounded-3xl bg-hero text-primary-foreground shadow-action",
        className,
      )}
    >
      <TrendingUp className="size-8 text-success" strokeWidth={2.75} />
    </span>
  );
}
