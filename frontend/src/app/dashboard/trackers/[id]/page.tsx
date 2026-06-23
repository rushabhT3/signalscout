"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { ArrowLeft, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SignalRow } from "@/components/signals/signal-row";

export default function TrackerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { data: tracker, isLoading } = useSWR(["tracker", id], () => api.tracker(id));
  const signalsQuery = `?trackerId=${id}&matchesOnly=true&limit=100`;
  const { data: signals } = useSWR(["signals", signalsQuery], () => api.signals(signalsQuery));
  const [running, setRunning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleRun() {
    setRunning(true);
    try {
      const result = await api.runTracker(id);
      toast.success(`${result.matches} new match${result.matches === 1 ? "" : "es"} from ${result.evaluated} evaluated.`);
      if (result.skippedInsufficientCredits) {
        toast.warning("Stopped early — you're out of credits.");
      }
      await Promise.all([
        mutate(["tracker", id]),
        mutate(["signals", signalsQuery]),
        mutate("credits"),
      ]);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Run failed.");
    } finally {
      setRunning(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this tracker and all its signals?")) {
      return;
    }
    setDeleting(true);
    try {
      await api.deleteTracker(id);
      await mutate("trackers");
      toast.success("Tracker deleted.");
      router.push("/dashboard/trackers");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not delete tracker.");
      setDeleting(false);
    }
  }

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  if (!tracker) {
    return (
      <EmptyState
        title="Tracker not found"
        description="It may have been deleted."
        action={
          <Link href="/dashboard/trackers">
            <Button size="sm">Back to trackers</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <Link
        href="/dashboard/trackers"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Trackers
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-ink">{tracker.name}</h1>
            <Badge tone={tracker.isActive ? "accent" : "neutral"}>
              {tracker.isActive ? "Active" : "Paused"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted">{tracker.signalHypothesis}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete} aria-label="Delete tracker">
            <Trash2 className="size-4" />
          </Button>
          <Button size="sm" loading={running} onClick={handleRun} className="gap-1.5">
            <Play className="size-4" />
            Run now
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Detail label="Product">{tracker.productDescription}</Detail>
          <Detail label="Keywords">
            {tracker.keywords.length > 0 ? tracker.keywords.join(", ") : "—"}
          </Detail>
          <Detail label="Sources">
            {tracker.sources.map((source) => `${source.label} (${source.provider})`).join(", ")}
          </Detail>
        </CardContent>
      </Card>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-ink">Matched signals</h2>
      <Card>
        {!signals ? (
          <div className="space-y-3 p-4">
            {[0, 1].map((index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : signals.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Play}
              title="No matches yet"
              description="Run this tracker to evaluate its companies' latest job postings."
            />
          </div>
        ) : (
          <div>
            {signals.map((signal) => (
              <SignalRow key={signal.id} signal={signal} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-1 text-sm text-ink-soft">{children}</p>
    </div>
  );
}
