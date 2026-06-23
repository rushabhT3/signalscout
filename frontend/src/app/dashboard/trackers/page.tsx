"use client";

import Link from "next/link";
import useSWR from "swr";
import { Plus, Radar } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TrackerCard } from "@/components/trackers/tracker-card";

export default function TrackersPage() {
  const { data, isLoading } = useSWR("trackers", api.trackers);

  return (
    <div>
      <PageHeader
        title="Trackers"
        description="Each tracker watches companies' job boards for your buying signals."
        action={
          <Link href="/dashboard/trackers/new">
            <Button className="gap-1.5">
              <Plus className="size-4" />
              New tracker
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Radar}
          title="No trackers yet"
          description="Create your first tracker to start surfacing buying signals from public job postings."
          action={
            <Link href="/dashboard/trackers/new">
              <Button size="sm">Create a tracker</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((tracker) => (
            <TrackerCard key={tracker.id} tracker={tracker} />
          ))}
        </div>
      )}
    </div>
  );
}
