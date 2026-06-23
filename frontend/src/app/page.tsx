import Link from "next/link";
import { ArrowRight, Radar, Sparkles, Send } from "lucide-react";
import { Logo, Wordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  {
    icon: Radar,
    title: "Define a signal",
    body: "Describe what you sell and what a buying moment looks like — e.g. companies hiring multiple AEs.",
  },
  {
    icon: Sparkles,
    title: "AI scores the matches",
    body: "We pull fresh public job postings and let Gemini judge each one against your hypothesis, with reasons.",
  },
  {
    icon: Send,
    title: "Reach out with an angle",
    body: "Every match comes with the likely need and a drafted, signal-specific outreach email.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Logo className="size-7" />
          <Wordmark className="text-lg" />
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6">
        <section className="grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div>
            <Badge tone="accent" className="mb-5">
              <span className="size-1.5 rounded-full bg-accent" />
              B2B buying signals
            </Badge>
            <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-ink md:text-5xl">
              Turn public hiring data into qualified pipeline.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
              SignalScout watches the job boards of companies you care about, then uses AI to
              surface — and explain — the postings that signal they&apos;re ready to buy.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup">
                <Button size="md" className="gap-2">
                  Start free <ArrowRight className="size-4" />
                </Button>
              </Link>
              <span className="text-sm text-muted">50 free credits · no card required</span>
            </div>
          </div>

          <SampleSignal />
        </section>

        <section className="border-t border-border py-16">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-ink">
            From signal to conversation in three steps
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="rounded-xl border border-border bg-surface p-6 shadow-card"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
                  <step.icon className="size-5" />
                </div>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-faint">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 text-base font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-8 text-sm text-muted">
        <div className="flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} SignalScout</span>
          <span>Built on Next.js, NestJS, Supabase &amp; Gemini.</span>
        </div>
      </footer>
    </div>
  );
}

function SampleSignal() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-pop">
      <div className="flex items-center justify-between">
        <Badge tone="accent">Team expansion</Badge>
        <span className="text-xs font-medium tabular-nums text-muted">88% match</span>
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink">Northwind Labs</h3>
      <p className="text-sm text-muted">Senior Account Executive (EMEA) · London</p>
      <div className="mt-4 rounded-lg bg-surface-2 p-3 text-sm leading-relaxed text-ink-soft">
        Hiring a senior AE and an SDR at once in EMEA — a clear sign they&apos;re scaling outbound
        and standing up a new pipeline motion.
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-accent-ink">
        <Send className="size-4" />
        AI-drafted outreach ready
      </div>
    </div>
  );
}
