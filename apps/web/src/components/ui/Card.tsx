import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/utils/cn";

function CardRoot({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "bg-surface-elevated border border-border rounded-lg shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("p-4 border-b border-border", className)} {...props} />;
}

function CardBody({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("p-4", className)} {...props} />;
}

function CardFooter({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("p-4 border-t border-border", className)} {...props} />;
}

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
