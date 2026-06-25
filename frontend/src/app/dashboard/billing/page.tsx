"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { PLAN_LIMITS } from "@signalscout/shared";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BillingPage() {
  const { data: account } = useSWR("credits", api.credits);
  const { data: ledger } = useSWR("ledger", api.ledger);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("status");
    if (status === "success") {
      toast.success("You're on Pro — thanks!");
    } else if (status === "cancelled") {
      toast.info("Checkout cancelled.");
    }
  }, []);

  async function redirectTo(action: "checkout" | "portal") {
    setLoading(true);
    try {
      const { url } = action === "checkout" ? await api.checkout() : await api.portal();
      window.location.href = url;
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Billing is unavailable right now.");
      setLoading(false);
    }
  }

  const isPro = account?.planTier === "pro";

  return (
    <div>
      <PageHeader title="Billing" description="Manage your plan and credits." />

      <Card>
        <CardContent>
          {!account ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-ink">
                    {PLAN_LIMITS[account.planTier].label} plan
                  </h2>
                  <Badge tone={isPro ? "accent" : "neutral"}>
                    {account.balance} / {account.monthlyAllotment} credits
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted">
                  Renews {new Date(account.resetsAt).toLocaleDateString()}.
                </p>
              </div>
              <Button
                loading={loading}
                variant={isPro ? "secondary" : "primary"}
                onClick={() => redirectTo(isPro ? "portal" : "checkout")}
                className="gap-1.5"
              >
                {isPro ? "Manage billing" : "Upgrade to Pro"}
                <ExternalLink className="size-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {!isPro ? (
        <Card className="mt-4">
          <CardContent>
            <h3 className="text-sm font-semibold text-ink">Pro includes</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                `${PLAN_LIMITS.pro.monthlyCredits.toLocaleString()} credits / month`,
                `Up to ${PLAN_LIMITS.pro.maxTrackers} trackers`,
                "AI outreach drafting",
                "Daily signal digests",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-ink-soft">
                  <Check className="size-4 text-accent" />
                  {feature}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-faint">Stripe test mode — use card 4242 4242 4242 4242.</p>
          </CardContent>
        </Card>
      ) : null}

      <h2 className="mb-3 mt-8 text-sm font-semibold text-ink">Recent activity</h2>
      <Card>
        {!ledger ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : ledger.length === 0 ? (
          <p className="p-5 text-sm text-muted">No credit activity yet.</p>
        ) : (
          <div>
            <ul>
              {ledger.slice(0, visibleCount).map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between border-b border-border px-5 py-3 text-sm last:border-0"
                >
                  <span className="capitalize text-ink-soft">{entry.reason.replace(/_/g, " ")}</span>
                  <span
                    className={
                      entry.amount >= 0 ? "font-medium text-accent" : "font-medium text-ink"
                    }
                  >
                    {entry.amount >= 0 ? "+" : ""}
                    {entry.amount}
                  </span>
                </li>
              ))}
            </ul>
            {visibleCount < ledger.length && (
              <div className="border-t border-border p-3 text-center">
                <Button variant="secondary" size="sm" onClick={() => setVisibleCount((v) => v + 5)}>
                  Load more
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
