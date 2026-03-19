import { Progress } from "@/components/ui";
import { formatCapacity } from "@/utils/format";

interface CapacityBarProps {
  used: number;
  total: number;
}

export function CapacityBar({ used, total }: CapacityBarProps) {
  const pct = total > 0 ? (used / total) * 100 : 0;
  const variant = pct > 90 ? "error" : pct > 75 ? "warning" : "default";

  return (
    <div className="flex items-center gap-4">
      <Progress className="flex-1" value={pct} variant={variant} />
      <span className="text-xs text-text-muted whitespace-nowrap">
        {formatCapacity(used)} / {formatCapacity(total)}
      </span>
    </div>
  );
}
