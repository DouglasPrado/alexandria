import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/utils/cn";

export function Skeleton({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-border/50", className)}
      {...props}
    />
  );
}
