import Link from "next/link";
import { Logo, Wordmark } from "@/components/brand/logo";
import { NavLinks } from "@/components/dashboard/nav";

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <Link href="/dashboard" className="flex items-center gap-2 px-5 py-5">
        <Logo className="size-7" />
        <Wordmark className="text-base" />
      </Link>
      <NavLinks />
    </aside>
  );
}
