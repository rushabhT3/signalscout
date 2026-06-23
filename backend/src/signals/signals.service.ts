import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  CREDIT_COSTS,
  type GenerateOutreachInput,
  type SignalListQuery,
  type SignalView,
  type TrackerRunResult,
  type UpdateSignalInput,
} from "@signalscout/shared";
import { AI_EVALUATOR, type AiEvaluator } from "../ai/ai-evaluator";
import { CreditsService } from "../credits/credits.service";
import { InsufficientCreditsException } from "../credits/insufficient-credits.exception";
import { IngestionService } from "../ingestion/ingestion.service";
import type { CreditReason } from "../supabase/database.types";
import { TrackerRepository } from "../trackers/tracker.repository";
import { SignalRepository } from "./signal.repository";

@Injectable()
export class SignalsService {
  private readonly logger = new Logger(SignalsService.name);

  constructor(
    private readonly signals: SignalRepository,
    private readonly trackers: TrackerRepository,
    private readonly ingestion: IngestionService,
    private readonly credits: CreditsService,
    @Inject(AI_EVALUATOR) private readonly ai: AiEvaluator,
  ) {}

  list(userId: string, query: SignalListQuery): Promise<SignalView[]> {
    return this.signals.listByUser(userId, query);
  }

  async get(userId: string, id: string): Promise<SignalView> {
    const signal = await this.signals.findById(userId, id);
    if (!signal) {
      throw new NotFoundException({ code: "signal_not_found", message: "Signal not found." });
    }
    return signal;
  }

  async updateStatus(userId: string, id: string, input: UpdateSignalInput): Promise<SignalView> {
    const updated = await this.signals.updateStatus(userId, id, input.status);
    if (!updated) {
      throw new NotFoundException({ code: "signal_not_found", message: "Signal not found." });
    }
    return updated;
  }

  /**
   * Ingests fresh postings for a tracker and evaluates each previously-unseen one,
   * debiting a credit per evaluation. Stops cleanly when credits run out; refunds
   * a credit when an individual evaluation fails.
   */
  async runTracker(userId: string, trackerId: string): Promise<TrackerRunResult> {
    const tracker = await this.trackers.findById(userId, trackerId);
    if (!tracker) {
      throw new NotFoundException({ code: "tracker_not_found", message: "Tracker not found." });
    }

    const postings = await this.ingestion.ingestForSources(tracker.sources);
    const alreadyEvaluated = await this.signals.findEvaluatedPostingIds(trackerId);
    const fresh = postings.filter((posting) => !alreadyEvaluated.has(posting.id));

    const result: TrackerRunResult = {
      trackerId,
      postingsIngested: postings.length,
      evaluated: 0,
      matches: 0,
      creditsSpent: 0,
      skippedInsufficientCredits: false,
    };

    for (const posting of fresh) {
      try {
        await this.credits.debit(userId, CREDIT_COSTS.signalEvaluation, "signal_evaluation", posting.id);
      } catch (error) {
        if (error instanceof InsufficientCreditsException) {
          result.skippedInsufficientCredits = true;
          break;
        }
        throw error;
      }
      result.creditsSpent += CREDIT_COSTS.signalEvaluation;

      try {
        const evaluation = await this.ai.evaluateSignal({
          productDescription: tracker.productDescription,
          signalHypothesis: tracker.signalHypothesis,
          keywords: tracker.keywords,
          posting: {
            company: posting.company,
            title: posting.title,
            location: posting.location,
            description: posting.description,
          },
        });

        await this.signals.create({
          userId,
          trackerId,
          jobPostingId: posting.id,
          company: posting.company,
          title: posting.title,
          location: posting.location,
          url: posting.url,
          postedAt: posting.postedAt,
          evaluation,
          model: this.ai.name,
        });

        result.evaluated += 1;
        if (evaluation.isMatch) {
          result.matches += 1;
        }
      } catch (error) {
        await this.refund(userId, CREDIT_COSTS.signalEvaluation, posting.id);
        result.creditsSpent -= CREDIT_COSTS.signalEvaluation;
        this.logger.warn(
          `Evaluation failed for posting ${posting.id}: ${(error as Error).message}`,
        );
      }
    }

    await this.trackers.markRun(trackerId);
    this.logger.log(
      `Tracker ${trackerId} run — evaluated ${result.evaluated}, matches ${result.matches}`,
    );
    return result;
  }

  async generateOutreach(
    userId: string,
    signalId: string,
    input: GenerateOutreachInput,
  ): Promise<SignalView> {
    const signal = await this.signals.findById(userId, signalId);
    if (!signal) {
      throw new NotFoundException({ code: "signal_not_found", message: "Signal not found." });
    }
    if (!signal.isMatch) {
      throw new BadRequestException({
        code: "not_a_match",
        message: "Outreach can only be drafted for matched signals.",
      });
    }

    const tracker = await this.trackers.findById(userId, signal.trackerId);
    if (!tracker) {
      throw new NotFoundException({ code: "tracker_not_found", message: "Tracker not found." });
    }

    const outreach = await this.withCredit(
      userId,
      CREDIT_COSTS.outreachDraft,
      "outreach_draft",
      signalId,
      () =>
        this.ai.draftOutreach({
          productDescription: tracker.productDescription,
          tone: input.tone,
          company: signal.company,
          title: signal.title,
          category: signal.category,
          likelyNeed: signal.likelyNeed,
          suggestedAngle: signal.suggestedAngle,
        }),
    );

    const updated = await this.signals.attachOutreach(userId, signalId, outreach);
    if (!updated) {
      throw new NotFoundException({ code: "signal_not_found", message: "Signal not found." });
    }
    return updated;
  }

  private async withCredit<T>(
    userId: string,
    cost: number,
    reason: CreditReason,
    reference: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    await this.credits.debit(userId, cost, reason, reference);
    try {
      return await operation();
    } catch (error) {
      await this.refund(userId, cost, reference);
      throw error;
    }
  }

  private async refund(userId: string, amount: number, reference: string): Promise<void> {
    await this.credits
      .grant(userId, amount, "manual_adjustment", `refund:${reference}`)
      .catch((error: unknown) => {
        this.logger.error(`Failed to refund credits for ${reference}: ${String(error)}`);
      });
  }
}
