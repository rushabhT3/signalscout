import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { TrackerForm } from "@/components/trackers/tracker-form";

export const metadata: Metadata = { title: "New tracker" };

export default function NewTrackerPage() {
  return (
    <div>
      <PageHeader
        title="New tracker"
        description="Tell SignalScout what to watch and what a buying signal looks like."
      />
      <TrackerForm />
    </div>
  );
}
