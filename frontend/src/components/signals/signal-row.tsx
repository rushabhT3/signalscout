import Link from "next/link";
import type { SignalView } from "@signalscout/shared";
import { CategoryBadge } from "./category-badge";
import { ConfidenceBar } from "./confidence-bar";
import { formatRelativeDate } from "@/lib/utils";

export function SignalRow({ signal }: { signal: SignalView }) {
  return (
    <Link
      href={`/dashboard/signals/${signal.id}`}
      className="flex items-center gap-4 border-b border-border px-4 py-3 transition-colors last:border-0 hover:bg-surface-2"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-ink">{signal.company}</span>
          <CategoryBadge category={signal.category} />
        </div>
        <p className="truncate text-sm text-muted">
          {signal.title}
          {signal.location ? ` · ${signal.location}` : ""}
        </p>
      </div>
      <div className="hidden sm:block">
        <ConfidenceBar value={signal.confidence} />
      </div>
      <span className="hidden w-16 text-right text-xs text-faint md:inline">
        {formatRelativeDate(signal.createdAt)}
      </span>
    </Link>
  );
}
