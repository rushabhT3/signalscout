"use client";

import Link from "next/link";
import useSWR from "swr";
import { Coins, Inbox, Plus, Radar, type LucideIcon } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SignalRow } from "@/components/signals/signal-row";

export default function OverviewPage() {
  const { data: credits } = useSWR("credits", api.credits);
  const { data: trackers } = useSWR("trackers", api.trackers);
  const { data: signals } = useSWR(["signals", "overview"], () =>
    api.signals("?matchesOnly=true&limit=6"),
  );

  const activeTrackers = trackers?.filter((tracker) => tracker.isActive).length;

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Your signal pipeline at a glance."
        action={
          <Link href="/dashboard/trackers/new">
            <Button className="gap-1.5">
              <Plus className="size-4" />
              New tracker
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Radar} label="Active trackers" value={activeTrackers} />
        <Stat icon={Inbox} label="Recent matches" value={signals?.length} />
        <Stat icon={Coins} label="Credits" value={credits?.balance} />
      </div>

      <Card className="mt-6">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">Recent matches</h2>
        </div>
        {!signals ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : signals.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Inbox}
              title="No matches yet"
              description="Create a tracker and run it to surface buying signals."
              action={
                <Link href="/dashboard/trackers/new">
                  <Button size="sm">Create a tracker</Button>
                </Link>
              }
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

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
          <Icon className="size-5" />
        </div>
        <div>
          {value === undefined ? (
            <Skeleton className="h-7 w-10" />
          ) : (
            <p className="text-2xl font-semibold tabular-nums text-ink">{value}</p>
          )}
          <p className="text-xs text-muted">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
