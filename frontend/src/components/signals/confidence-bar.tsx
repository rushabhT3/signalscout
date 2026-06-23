import { cn } from "@/lib/utils";

export function ConfidenceBar({ value }: { value: number }) {
  const tone = value >= 75 ? "bg-accent" : value >= 50 ? "bg-amber" : "bg-faint";
  return (
    <div className="flex items-center gap-2" title={`${value}% confidence`}>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-2">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium tabular-nums text-muted">{value}</span>
    </div>
  );
}
