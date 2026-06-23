export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="var(--color-accent)" />
      <path
        d="M6.5 16.5a7 7 0 0 1 7-7"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M6.5 13a3.5 3.5 0 0 1 3.5-3.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="7" cy="17" r="1.7" fill="white" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="font-semibold tracking-tight text-ink">Signal</span>
      <span className="font-semibold tracking-tight text-accent">Scout</span>
    </span>
  );
}
