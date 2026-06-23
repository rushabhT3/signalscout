"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Inbox, LayoutDashboard, Radar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo, Wordmark } from "@/components/brand/logo";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/trackers", label: "Trackers", icon: Radar, exact: false },
  { href: "/dashboard/signals", label: "Signals", icon: Inbox, exact: false },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard, exact: false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <Link href="/dashboard" className="flex items-center gap-2 px-5 py-5">
        <Logo className="size-7" />
        <Wordmark className="text-base" />
      </Link>
      <nav className="flex flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-accent-soft text-accent-ink" : "text-ink-soft hover:bg-surface-2",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
