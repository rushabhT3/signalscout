"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Coins, LogOut } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/endpoints";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileNav } from "@/components/dashboard/mobile-nav";

export function Topbar({ email }: { email: string }) {
  const router = useRouter();
  const { data: credits } = useSWR("credits", api.credits);

  async function handleSignOut() {
    await createClient().auth.signOut();
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-surface/80 px-5 backdrop-blur">
      <div className="flex items-center gap-2">
        <MobileNav />
        <div className="flex items-center gap-2 text-sm text-muted">
          <Coins className="size-4 text-accent" />
          {credits ? (
            <span className="font-medium tabular-nums text-ink">{credits.balance}</span>
          ) : (
            <Skeleton className="h-4 w-8" />
          )}
          <span>credits</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted sm:inline">{email}</span>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
