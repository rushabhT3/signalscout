"use client";

import { use, useState } from "react";
import Link from "next/link";
import useSWR, { useSWRConfig } from "swr";
import { ArrowLeft, Copy, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  OUTREACH_TONES,
  OUTREACH_TONE_LABELS,
  type LeadStatus,
  type OutreachTone,
} from "@signalscout/shared";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryBadge } from "@/components/signals/category-badge";
import { ConfidenceBar } from "@/components/signals/confidence-bar";
import { StatusSelect } from "@/components/signals/status-select";

export default function SignalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: signal, isLoading, mutate: mutateSignal } = useSWR(["signal", id], () =>
    api.signal(id),
  );
  const { mutate } = useSWRConfig();
  const [tone, setTone] = useState<OutreachTone>("consultative");
  const [generating, setGenerating] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function handleStatus(status: LeadStatus) {
    setUpdatingStatus(true);
    try {
      const updated = await api.updateSignalStatus(id, status);
      await mutateSignal(updated, { revalidate: false });
      await mutate((key) => Array.isArray(key) && key[0] === "signals");
      toast.success("Status updated.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const updated = await api.generateOutreach(id, { tone });
      await mutateSignal(updated, { revalidate: false });
      await mutate("credits");
      toast.success("Outreach drafted.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not draft outreach.");
    } finally {
      setGenerating(false);
    }
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard.");
  }

  if (isLoading) {
    return <Skeleton className="h-80 w-full rounded-xl" />;
  }

  if (!signal) {
    return (
      <EmptyState
        title="Signal not found"
        description="It may have been deleted."
        action={
          <Link href="/dashboard/signals">
            <Button size="sm">Back to signals</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <Link
        href="/dashboard/signals"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Signals
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-ink">{signal.company}</h1>
            <CategoryBadge category={signal.category} />
          </div>
          <a
            href={signal.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent"
          >
            {signal.title}
            {signal.location ? ` · ${signal.location}` : ""}
            <ExternalLink className="size-3.5" />
          </a>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <ConfidenceBar value={signal.confidence} />
          <StatusSelect value={signal.status} onChange={handleStatus} disabled={updatingStatus} />
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardContent className="space-y-4">
            <Detail label="Why it matched">{signal.reasoning}</Detail>
            <Detail label="Likely need">{signal.likelyNeed}</Detail>
            <Detail label="Suggested angle">{signal.suggestedAngle}</Detail>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-ink">Outreach draft</h2>
              {!signal.outreach ? (
                <div className="flex items-center gap-2">
                  <select
                    value={tone}
                    onChange={(event) => setTone(event.target.value as OutreachTone)}
                    className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm text-ink focus:border-accent focus:outline-none"
                  >
                    {OUTREACH_TONES.map((option) => (
                      <option key={option} value={option}>
                        {OUTREACH_TONE_LABELS[option]}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" loading={generating} onClick={handleGenerate} className="gap-1.5">
                    <Sparkles className="size-4" />
                    Draft (2 credits)
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="secondary" loading={generating} onClick={handleGenerate}>
                  Regenerate
                </Button>
              )}
            </div>

            {signal.outreach ? (
              <div className="mt-4 space-y-3">
                <OutreachField label="Subject" value={signal.outreach.subject} onCopy={copy} />
                <OutreachField label="Email" value={signal.outreach.body} onCopy={copy} multiline />
                <OutreachField label="Follow-up" value={signal.outreach.followUp} onCopy={copy} multiline />
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">
                Generate a personalized, signal-specific outreach email and follow-up.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}

function OutreachField({
  label,
  value,
  onCopy,
  multiline,
}: {
  label: string;
  value: string;
  onCopy: (text: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-faint">{label}</span>
        <button
          type="button"
          onClick={() => onCopy(value)}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent"
        >
          <Copy className="size-3.5" />
          Copy
        </button>
      </div>
      <p className={cn(multiline ? "whitespace-pre-wrap" : "", "text-sm text-ink")}>{value}</p>
    </div>
  );
}
