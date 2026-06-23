"use client";

import Link from "next/link";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { Play } from "lucide-react";
import { toast } from "sonner";
import type { Tracker } from "@signalscout/shared";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils";

export function TrackerCard({ tracker }: { tracker: Tracker }) {
  const { mutate } = useSWRConfig();
  const [running, setRunning] = useState(false);

  async function handleRun() {
    setRunning(true);
    try {
      const result = await api.runTracker(tracker.id);
      toast.success(
        `Ran "${tracker.name}" — ${result.matches} new match${
          result.matches === 1 ? "" : "es"
        } from ${result.evaluated} evaluated.`,
      );
      if (result.skippedInsufficientCredits) {
        toast.warning("Stopped early — you're out of credits.");
      }
      await Promise.all([
        mutate("trackers"),
        mutate("credits"),
        mutate((key) => Array.isArray(key) && key[0] === "signals"),
      ]);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Run failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/dashboard/trackers/${tracker.id}`}
          className="font-medium text-ink hover:text-accent"
        >
          {tracker.name}
        </Link>
        <Badge tone={tracker.isActive ? "accent" : "neutral"}>
          {tracker.isActive ? "Active" : "Paused"}
        </Badge>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted">{tracker.signalHypothesis}</p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-xs text-faint">
          {tracker.sources.length} source{tracker.sources.length === 1 ? "" : "s"} · last run{" "}
          {formatRelativeDate(tracker.lastRunAt)}
        </span>
        <Button
          size="sm"
          variant="secondary"
          loading={running}
          onClick={handleRun}
          className="gap-1.5"
        >
          <Play className="size-3.5" />
          Run
        </Button>
      </div>
    </div>
  );
}
