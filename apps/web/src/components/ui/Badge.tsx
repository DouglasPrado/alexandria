import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/utils/cn";

const variants = {
  default: "bg-border text-text-muted",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
  info: "bg-info/10 text-info",
} as const;

const sizes = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-xs",
} as const;

interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function Badge({ variant = "default", size = "md", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
