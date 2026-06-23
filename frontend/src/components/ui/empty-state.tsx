import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong px-6 py-16 text-center">
      {Icon ? (
        <div className="flex size-11 items-center justify-center rounded-full bg-surface-2 text-muted">
          <Icon className="size-5" />
        </div>
      ) : null}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <p className="mx-auto max-w-sm text-sm text-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
