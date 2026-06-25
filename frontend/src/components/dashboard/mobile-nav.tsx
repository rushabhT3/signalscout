"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo, Wordmark } from "@/components/brand/logo";
import { NavLinks } from "@/components/dashboard/nav";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function handleClose() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        className="-ml-1 rounded-lg p-2 text-ink-soft transition-colors hover:bg-surface-2 md:hidden"
      >
        <Menu className="size-5" />
      </button>

      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          isOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!isOpen}
      >
        <div
          onClick={handleClose}
          className={cn(
            "absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-200",
            isOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={cn(
            "absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-surface shadow-xl transition-transform duration-200 ease-out",
            isOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between px-5 py-5">
            <Link href="/dashboard" onClick={handleClose} className="flex items-center gap-2">
              <Logo className="size-7" />
              <Wordmark className="text-base" />
            </Link>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close navigation menu"
              className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-surface-2"
            >
              <X className="size-5" />
            </button>
          </div>
          <NavLinks onNavigate={handleClose} />
        </div>
      </div>
    </>
  );
}
