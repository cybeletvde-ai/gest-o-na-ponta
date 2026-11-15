import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        entrada:
          "bg-success text-success-foreground shadow-action hover:bg-success/90 active:scale-[0.98]",
        saida:
          "bg-destructive text-destructive-foreground shadow-action hover:bg-destructive/90 active:scale-[0.98]",
        retirada:
          "bg-primary text-primary-foreground shadow-action hover:bg-primary/90 active:scale-[0.98]",
        choice:
          "rounded-2xl border-2 border-border bg-surface text-foreground hover:bg-muted aria-pressed:border-primary aria-pressed:bg-secondary aria-pressed:text-primary aria-pressed:hover:bg-secondary",
        pill: "rounded-full border border-border bg-surface text-foreground hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary",
        "quick-receive":
          "rounded-full bg-success text-success-foreground shadow-sm hover:bg-success/90 active:scale-95",
        "quick-pay":
          "rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-95",
        fab: "rounded-full bg-success text-success-foreground shadow-fab ring-4 ring-surface hover:bg-success/90 active:scale-95",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        action: "h-16 w-full justify-start gap-4 rounded-2xl px-5 text-base font-bold [&_svg]:size-6",
        fab: "h-16 w-16 [&_svg]:size-8",
        choice: "h-12 flex-1 px-3 text-sm font-bold [&_svg]:size-5",
        pill: "h-9 px-4 text-sm font-semibold",
        submit: "h-13 w-full rounded-2xl text-base font-extrabold [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
