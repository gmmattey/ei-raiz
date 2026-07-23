import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap rounded-md",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
    "disabled:pointer-events-none disabled:opacity-50",
    "ty-button",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-brand-primary text-bg-primary hover:opacity-90",
        secondary:
          "bg-bg-surface text-text-primary border border-border-default hover:bg-bg-secondary",
        ghost: "bg-transparent text-text-primary hover:bg-bg-surface",
        danger: "bg-state-error text-bg-primary hover:opacity-90",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  isLoading = false,
  loadingLabel,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={props.disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
          />
          <span>{loadingLabel ?? "Carregando"}</span>
        </span>
      ) : (
        props.children
      )}
    </Comp>
  );
}
