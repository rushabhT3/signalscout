"use client";

import { useState } from "react";
import useSWR from "swr";
import { Inbox } from "lucide-react";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@signalscout/shared";
import { api } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SignalRow } from "@/components/signals/signal-row";
import { cn } from "@/lib/utils";

type Filter = LeadStatus | "all";

const FILTERS: Filter[] = ["all", ...LEAD_STATUSES];

export default function SignalsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const query = `?matchesOnly=true&limit=100${filter === "all" ? "" : `&status=${filter}`}`;
  const { data, isLoading } = useSWR(["signals", query], () => api.signals(query));

  return (
    <div>
      <PageHeader title="Signals" description="Matched buying signals across your trackers." />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition-colors",
              filter === option
                ? "bg-ink text-inverse"
                : "bg-surface-2 text-ink-soft hover:bg-border",
            )}
          >
            {option === "all" ? "All" : LEAD_STATUS_LABELS[option]}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Inbox}
              title="No signals here"
              description="Run a tracker to surface matches, or adjust the filter above."
            />
          </div>
        ) : (
          <div>
            {data.map((signal) => (
              <SignalRow key={signal.id} signal={signal} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
