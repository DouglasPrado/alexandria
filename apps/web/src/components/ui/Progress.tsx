import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/utils/cn";

interface ProgressProps extends ComponentPropsWithoutRef<"div"> {
  value: number;
  max?: number;
  label?: string;
  variant?: "default" | "success" | "warning" | "error";
}

const barColors = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
} as const;

export function Progress({
  value,
  max = 100,
  label,
  variant = "default",
  className,
  ...props
}: ProgressProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)} {...props}>
      {label && (
        <p className="text-xs text-text-muted mb-1">{label}</p>
      )}
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColors[variant])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
