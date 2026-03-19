import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/utils/cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("text-center py-16", className)}>
      {Icon && <Icon className="mx-auto h-12 w-12 text-text-muted/50 mb-4" />}
      <p className="text-lg font-medium text-text">{title}</p>
      {description && (
        <p className="text-sm text-text-muted mt-1">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          <Button variant="primary" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
