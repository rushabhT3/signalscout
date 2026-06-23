import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { JobBoardProvider, SignalCategory } from "@signalscout/shared";

loadEnv({ path: resolve(__dirname, "../backend/.env.local") });
loadEnv({ path: resolve(__dirname, "../backend/.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "✗ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — set them in backend/.env(.local).",
  );
  process.exit(1);
}

const DEMO_EMAIL = "demo@signalscout.dev";
const DEMO_PASSWORD = "demo-password-123";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface SeedPosting {
  provider: JobBoardProvider;
  external_id: string;
  company: string;
  company_slug: string;
  title: string;
  location: string | null;
  description: string;
  url: string;
  posted_at: string;
  content_hash: string;
}

interface SeedSignal {
  external_id: string;
  is_match: boolean;
  confidence: number;
  category: SignalCategory;
  reasoning: string;
  likely_need: string;
  suggested_angle: string;
}

const POSTINGS: SeedPosting[] = [
  {
    provider: "greenhouse",
    external_id: "demo-gh-1001",
    company: "Northwind Labs",
    company_slug: "northwindlabs",
    title: "Senior Account Executive (EMEA)",
    location: "London, UK",
    description:
      "We are scaling our revenue org and hiring multiple Account Executives to own net-new enterprise pipeline across EMEA. You will run full-cycle sales motions and partner closely with SDRs.",
    url: "https://boards.greenhouse.io/northwindlabs/jobs/demo-gh-1001",
    posted_at: "2026-06-18T09:00:00.000Z",
    content_hash: "seed-hash-1001",
  },
  {
    provider: "greenhouse",
    external_id: "demo-gh-1002",
    company: "Northwind Labs",
    company_slug: "northwindlabs",
    title: "Sales Development Representative",
    location: "London, UK",
    description:
      "Join our growing outbound team as an SDR. You will book qualified meetings for our AEs and help build a repeatable top-of-funnel motion.",
    url: "https://boards.greenhouse.io/northwindlabs/jobs/demo-gh-1002",
    posted_at: "2026-06-17T09:00:00.000Z",
    content_hash: "seed-hash-1002",
  },
  {
    provider: "lever",
    external_id: "demo-lv-2001",
    company: "Atlas Robotics",
    company_slug: "atlasrobotics",
    title: "VP of Revenue Operations",
    location: "Remote (US)",
    description:
      "We are hiring our first VP of RevOps to build the systems, reporting, and tooling that will support our next phase of growth across sales and customer success.",
    url: "https://jobs.lever.co/atlasrobotics/demo-lv-2001",
    posted_at: "2026-06-15T09:00:00.000Z",
    content_hash: "seed-hash-2001",
  },
  {
    provider: "lever",
    external_id: "demo-lv-2002",
    company: "Atlas Robotics",
    company_slug: "atlasrobotics",
    title: "Mechanical Engineer, Actuation",
    location: "Boston, MA",
    description:
      "Design and validate next-generation actuation systems for our robotics platform. Requires strong mechanical design and prototyping experience.",
    url: "https://jobs.lever.co/atlasrobotics/demo-lv-2002",
    posted_at: "2026-06-14T09:00:00.000Z",
    content_hash: "seed-hash-2002",
  },
];

const SIGNALS: SeedSignal[] = [
  {
    external_id: "demo-gh-1001",
    is_match: true,
    confidence: 88,
    category: "team_expansion",
    reasoning:
      "Northwind Labs is hiring a senior AE and an SDR simultaneously in EMEA — a clear sign they are scaling outbound sales and standing up a new pipeline motion.",
    likely_need: "Sales enablement and outbound tooling to ramp a growing revenue team.",
    suggested_angle:
      "Lead with how you help new AE/SDR teams hit pipeline targets faster during a scale-up.",
  },
  {
    external_id: "demo-lv-2001",
    is_match: true,
    confidence: 81,
    category: "leadership_hire",
    reasoning:
      "Hiring a first VP of RevOps indicates Atlas Robotics is formalizing revenue systems and tooling — a strong buying moment for ops software.",
    likely_need: "RevOps tooling, reporting, and process automation as they professionalize GTM.",
    suggested_angle:
      "Reach out to the new VP with a 30-day RevOps quick-win plan tailored to a first ops hire.",
  },
  {
    external_id: "demo-lv-2002",
    is_match: false,
    confidence: 12,
    category: "not_a_match",
    reasoning:
      "This is a mechanical engineering role unrelated to revenue or go-to-market scaling, so it does not match the sales-tooling hypothesis.",
    likely_need: "None relevant to the tracker's hypothesis.",
    suggested_angle: "No outreach recommended.",
  },
];

async function ensureDemoUser(): Promise<string> {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;

  const existing = data.users.find((user) => user.email === DEMO_EMAIL);
  if (existing) {
    return existing.id;
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Demo Scout" },
  });
  if (createError) throw createError;
  return created.user.id;
}

async function main(): Promise<void> {
  console.log("→ Seeding SignalScout demo data…");
  const userId = await ensureDemoUser();
  console.log(`  • demo user: ${DEMO_EMAIL} (${userId})`);

  const { data: postings, error: postingError } = await admin
    .from("job_postings")
    .upsert(POSTINGS, { onConflict: "provider,external_id" })
    .select("id, external_id");
  if (postingError) throw postingError;

  const postingIdByExternalId = new Map<string, string>(
    (postings ?? []).map((row) => [row.external_id as string, row.id as string]),
  );
  console.log(`  • upserted ${postingIdByExternalId.size} job postings`);

  // Replace prior demo trackers (cascade deletes their signals).
  await admin.from("trackers").delete().eq("user_id", userId);

  const { data: tracker, error: trackerError } = await admin
    .from("trackers")
    .insert({
      user_id: userId,
      name: "Companies scaling their sales teams",
      product_description:
        "We sell an outbound sales-enablement platform to B2B revenue teams of 20–500 people.",
      signal_hypothesis:
        "A company posting multiple sales roles (AE, SDR, RevOps) is scaling go-to-market and likely needs better enablement and outbound tooling.",
      keywords: ["account executive", "sales development", "revenue operations"],
      locations: ["United Kingdom", "United States", "Remote"],
      sources: [
        { provider: "greenhouse", slug: "northwindlabs", label: "Northwind Labs" },
        { provider: "lever", slug: "atlasrobotics", label: "Atlas Robotics" },
      ],
      last_run_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (trackerError) throw trackerError;

  const trackerId = tracker.id as string;
  console.log(`  • created tracker: ${trackerId}`);

  const signalRows = SIGNALS.map((signal) => {
    const posting = POSTINGS.find((p) => p.external_id === signal.external_id);
    const postingId = postingIdByExternalId.get(signal.external_id);
    if (!posting || !postingId) {
      throw new Error(`Missing posting for signal ${signal.external_id}`);
    }
    return {
      user_id: userId,
      tracker_id: trackerId,
      job_posting_id: postingId,
      company: posting.company,
      title: posting.title,
      location: posting.location,
      url: posting.url,
      posted_at: posting.posted_at,
      is_match: signal.is_match,
      confidence: signal.confidence,
      category: signal.category,
      reasoning: signal.reasoning,
      likely_need: signal.likely_need,
      suggested_angle: signal.suggested_angle,
      model: "seed",
      status: "new" as const,
    };
  });

  const { error: signalError } = await admin
    .from("signals")
    .upsert(signalRows, { onConflict: "tracker_id,job_posting_id" });
  if (signalError) throw signalError;
  console.log(`  • inserted ${signalRows.length} signals (${SIGNALS.filter((s) => s.is_match).length} matches)`);

  console.log("✓ Seed complete.");
}

main().catch((error: unknown) => {
  console.error("✗ Seed failed:", error);
  process.exit(1);
});
