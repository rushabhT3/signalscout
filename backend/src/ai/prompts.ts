import type { DraftOutreachInput, EvaluateSignalInput } from "./ai-evaluator";

export const SIGNAL_SYSTEM_INSTRUCTION = [
  "You are a precise B2B sales-intelligence analyst.",
  "You decide whether a single job posting is a genuine buying signal for a specific seller,",
  "given that seller's product and their signal hypothesis.",
  "Be skeptical: only set isMatch=true when the posting clearly supports the hypothesis.",
  "confidence is an integer 0-100. Choose the single best-fitting category.",
  "Keep reasoning concise and grounded in concrete evidence from the posting.",
  "Respond with JSON only, matching the provided schema.",
].join(" ");

export function buildEvaluationPrompt(input: EvaluateSignalInput): string {
  const keywords = input.keywords.length > 0 ? input.keywords.join(", ") : "none specified";
  return [
    "Seller's product:",
    input.productDescription,
    "",
    "Signal hypothesis (what makes a company a match):",
    input.signalHypothesis,
    "",
    `Keywords the seller cares about: ${keywords}`,
    "",
    "Job posting to evaluate:",
    `- Company: ${input.posting.company}`,
    `- Title: ${input.posting.title}`,
    `- Location: ${input.posting.location ?? "unknown"}`,
    `- Description: ${input.posting.description}`,
    "",
    "Decide whether this posting is a buying signal for the seller.",
  ].join("\n");
}

export const OUTREACH_SYSTEM_INSTRUCTION = [
  "You are an expert B2B sales development rep who writes concise, personalized cold outreach that earns replies.",
  "No buzzwords or fluff. Reference the specific signal. Keep the email under 120 words.",
  "Respond with JSON only, matching the provided schema.",
].join(" ");

export function buildOutreachPrompt(input: DraftOutreachInput): string {
  return [
    `You are writing outreach on behalf of a seller, in a ${input.tone} tone.`,
    "",
    `Seller's product: ${input.productDescription}`,
    `Prospect company: ${input.company}`,
    `Detected signal: they posted "${input.title}" (category: ${input.category}).`,
    `Why it matters: ${input.likelyNeed}`,
    `Recommended angle: ${input.suggestedAngle}`,
    "",
    "Write a subject line (max 8 words), a short email body that references the specific",
    "signal and offers clear value, and a one-line follow-up message.",
  ].join("\n");
}
