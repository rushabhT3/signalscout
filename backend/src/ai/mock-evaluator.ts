import { Injectable } from "@nestjs/common";
import type { OutreachDraft, SignalCategory, SignalEvaluation } from "@signalscout/shared";
import type { AiEvaluator, DraftOutreachInput, EvaluateSignalInput } from "./ai-evaluator";

/**
 * Deterministic, network-free evaluator used when AI_PROVIDER=mock (local dev,
 * CI, and tests). Uses a simple keyword/title heuristic so behavior is stable.
 */
@Injectable()
export class MockEvaluator implements AiEvaluator {
  readonly name = "mock";

  async evaluateSignal(input: EvaluateSignalInput): Promise<SignalEvaluation> {
    const haystack = `${input.posting.title} ${input.posting.description}`.toLowerCase();
    const matchedKeywords = input.keywords.filter((keyword) =>
      haystack.includes(keyword.toLowerCase()),
    );
    const titleLooksGtm = /(sales|account executive|sdr|revenue|growth|gtm|marketing)/i.test(
      input.posting.title,
    );
    const isMatch = matchedKeywords.length > 0 || titleLooksGtm;
    const confidence = isMatch
      ? Math.min(95, 45 + matchedKeywords.length * 20 + (titleLooksGtm ? 15 : 0))
      : 12;

    return {
      isMatch,
      confidence,
      category: this.pickCategory(input.posting.title, isMatch),
      reasoning: isMatch
        ? `The posting "${input.posting.title}" aligns with the hypothesis${
            matchedKeywords.length > 0 ? ` via keywords: ${matchedKeywords.join(", ")}` : ""
          }.`
        : `The posting "${input.posting.title}" does not clearly support the hypothesis.`,
      likelyNeed: isMatch
        ? "Tooling or services to support this initiative."
        : "No clear need identified.",
      suggestedAngle: isMatch
        ? "Reference the specific role and offer a relevant, concrete quick win."
        : "No outreach recommended.",
    };
  }

  async draftOutreach(input: DraftOutreachInput): Promise<OutreachDraft> {
    return {
      subject: `Quick idea for ${input.company}`,
      body: `Hi there,\n\nI noticed ${input.company} is hiring for "${input.title}". ${input.likelyNeed} ${input.suggestedAngle}\n\nWould a short call be worthwhile?\n\nBest,\nThe SignalScout team`,
      followUp: `Following up on my note about ${input.company}'s "${input.title}" role — open to 15 minutes this week?`,
    };
  }

  private pickCategory(title: string, isMatch: boolean): SignalCategory {
    if (!isMatch) {
      return "not_a_match";
    }
    const normalized = title.toLowerCase();
    if (/(vp|head|director|chief|lead)/.test(normalized)) {
      return "leadership_hire";
    }
    if (/(sales|account executive|sdr|revenue)/.test(normalized)) {
      return "team_expansion";
    }
    return "hiring_surge";
  }
}
