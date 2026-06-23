import type { OutreachDraft, OutreachTone, SignalEvaluation } from "@signalscout/shared";

export interface EvaluateSignalInput {
  productDescription: string;
  signalHypothesis: string;
  keywords: string[];
  posting: {
    company: string;
    title: string;
    location: string | null;
    description: string;
  };
}

export interface DraftOutreachInput {
  productDescription: string;
  tone: OutreachTone;
  company: string;
  title: string;
  category: string;
  likelyNeed: string;
  suggestedAngle: string;
}

/**
 * Abstraction over the LLM. Swappable implementations (Gemini, mock) keep the
 * domain decoupled from any specific provider (Dependency Inversion).
 */
export interface AiEvaluator {
  readonly name: string;
  evaluateSignal(input: EvaluateSignalInput): Promise<SignalEvaluation>;
  draftOutreach(input: DraftOutreachInput): Promise<OutreachDraft>;
}

export const AI_EVALUATOR = Symbol("AI_EVALUATOR");
