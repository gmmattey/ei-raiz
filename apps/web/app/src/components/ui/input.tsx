import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          [
            "h-10 w-full rounded-md border border-border-default bg-bg-primary px-3",
            "text-text-primary placeholder:text-text-disabled",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "ty-body",
          ].join(" "),
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
