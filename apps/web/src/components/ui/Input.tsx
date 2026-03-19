import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { Search } from "lucide-react";
import { cn } from "@/utils/cn";

interface InputProps extends ComponentPropsWithoutRef<"input"> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, type, className, ...props }, ref) => (
    <div className="w-full">
      <div className="relative">
        {type === "search" && (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            "w-full rounded-lg border bg-surface-elevated px-3 py-2 text-sm text-text",
            "placeholder:text-text-muted/50",
            "focus:outline-none focus:ring-2 focus:ring-primary/50",
            type === "search" && "pl-9",
            error ? "border-error" : "border-border",
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  ),
);
Input.displayName = "Input";
