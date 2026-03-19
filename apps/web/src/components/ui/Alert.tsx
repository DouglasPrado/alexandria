import { type ComponentPropsWithoutRef } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/utils/cn";

const config = {
  success: { icon: CheckCircle, bg: "bg-success/5 border-success/20", text: "text-success" },
  warning: { icon: AlertTriangle, bg: "bg-warning/5 border-warning/20", text: "text-warning" },
  error: { icon: XCircle, bg: "bg-error/5 border-error/20", text: "text-error" },
  info: { icon: Info, bg: "bg-info/5 border-info/20", text: "text-info" },
} as const;

interface AlertProps extends ComponentPropsWithoutRef<"div"> {
  variant: keyof typeof config;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Alert({
  variant,
  title,
  dismissible,
  onDismiss,
  children,
  className,
  ...props
}: AlertProps) {
  const { icon: Icon, bg, text } = config[variant];

  return (
    <div
      className={cn("flex gap-3 rounded-lg border p-4", bg, className)}
      role="alert"
      {...props}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", text)} />
      <div className="flex-1 min-w-0">
        {title && <p className={cn("text-sm font-medium", text)}>{title}</p>}
        <div className="text-sm text-text">{children}</div>
      </div>
      {dismissible && (
        <button onClick={onDismiss} className="shrink-0 text-text-muted hover:text-text">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
