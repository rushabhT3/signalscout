import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "accent" | "amber" | "danger" | "info";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-ink-soft",
  accent: "bg-accent-soft text-accent-ink",
  amber: "bg-amber-soft text-amber",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
