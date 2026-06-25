"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Inbox, LayoutDashboard, Radar, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/trackers", label: "Trackers", icon: Radar, exact: false },
  { href: "/dashboard/signals", label: "Signals", icon: Inbox, exact: false },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard, exact: false },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
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
  );
}
