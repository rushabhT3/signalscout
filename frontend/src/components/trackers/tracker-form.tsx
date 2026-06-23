"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  JOB_BOARD_PROVIDERS,
  JOB_BOARD_PROVIDER_LABELS,
  createTrackerSchema,
  type JobBoardProvider,
} from "@signalscout/shared";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface SourceRow {
  provider: JobBoardProvider;
  slug: string;
  label: string;
}

const EMPTY_SOURCE: SourceRow = { provider: "greenhouse", slug: "", label: "" };

export function TrackerForm() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [name, setName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [signalHypothesis, setSignalHypothesis] = useState("");
  const [keywords, setKeywords] = useState("");
  const [sources, setSources] = useState<SourceRow[]>([{ ...EMPTY_SOURCE }]);
  const [submitting, setSubmitting] = useState(false);

  function updateSource(index: number, patch: Partial<SourceRow>) {
    setSources((prev) => prev.map((row, idx) => (idx === index ? { ...row, ...patch } : row)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = {
      name,
      productDescription,
      signalHypothesis,
      keywords: keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
      locations: [],
      sources: sources.map((row) => ({
        provider: row.provider,
        slug: row.slug.trim(),
        label: row.label.trim(),
      })),
    };

    const parsed = createTrackerSchema.safeParse(candidate);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please review the form.");
      return;
    }

    setSubmitting(true);
    try {
      const tracker = await api.createTracker(parsed.data);
      await mutate("trackers");
      toast.success("Tracker created.");
      router.push(`/dashboard/trackers/${tracker.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not create tracker.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-5">
          <Field label="Tracker name" htmlFor="name">
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Companies scaling their sales teams"
              required
            />
          </Field>
          <Field
            label="What do you sell?"
            htmlFor="product"
            hint="Used to judge relevance and draft outreach."
          >
            <Textarea
              id="product"
              value={productDescription}
              onChange={(event) => setProductDescription(event.target.value)}
              placeholder="We sell an outbound sales-enablement platform to B2B revenue teams of 20–500 people."
              required
            />
          </Field>
          <Field
            label="Signal hypothesis"
            htmlFor="hypothesis"
            hint="What makes a company a match?"
          >
            <Textarea
              id="hypothesis"
              value={signalHypothesis}
              onChange={(event) => setSignalHypothesis(event.target.value)}
              placeholder="A company posting multiple sales roles is scaling go-to-market and likely needs better enablement tooling."
              required
            />
          </Field>
          <Field
            label="Keywords (optional)"
            htmlFor="keywords"
            hint="Comma-separated role titles to weight, e.g. account executive, SDR."
          >
            <Input
              id="keywords"
              value={keywords}
              onChange={(event) => setKeywords(event.target.value)}
              placeholder="account executive, sales development, revenue operations"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">Company job boards</h3>
              <p className="text-sm text-muted">Add the public board slug for each company to watch.</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setSources((prev) => [...prev, { ...EMPTY_SOURCE }])}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Add
            </Button>
          </div>

          <div className="space-y-3">
            {sources.map((row, index) => (
              <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[8rem_1fr_1fr_auto]">
                <select
                  value={row.provider}
                  onChange={(event) =>
                    updateSource(index, { provider: event.target.value as JobBoardProvider })
                  }
                  className="h-10 rounded-lg border border-border bg-surface px-2.5 text-sm text-ink focus:border-accent focus:outline-none"
                >
                  {JOB_BOARD_PROVIDERS.map((provider) => (
                    <option key={provider} value={provider}>
                      {JOB_BOARD_PROVIDER_LABELS[provider]}
                    </option>
                  ))}
                </select>
                <Input
                  value={row.slug}
                  onChange={(event) => updateSource(index, { slug: event.target.value })}
                  placeholder="board slug (e.g. northwindlabs)"
                  aria-label="Board slug"
                />
                <Input
                  value={row.label}
                  onChange={(event) => updateSource(index, { label: event.target.value })}
                  placeholder="Company name"
                  aria-label="Company name"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Remove source"
                  disabled={sources.length === 1}
                  onClick={() => setSources((prev) => prev.filter((_, idx) => idx !== index))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Create tracker
        </Button>
      </div>
    </form>
  );
}
