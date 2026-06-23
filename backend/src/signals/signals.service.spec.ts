import { BadRequestException } from '@nestjs/common';
import {
  CREDIT_COSTS,
  type SignalEvaluation,
  type Tracker,
} from '@signalscout/shared';
import { SignalsService } from './signals.service';
import { InsufficientCreditsException } from '../credits/insufficient-credits.exception';
import type { SignalRepository } from './signal.repository';
import type { TrackerRepository } from '../trackers/tracker.repository';
import type {
  IngestedPosting,
  IngestionService,
} from '../ingestion/ingestion.service';
import type { CreditsService } from '../credits/credits.service';

const TRACKER: Tracker = {
  id: 't1',
  name: 'Sales scaling',
  productDescription: 'Sales tooling',
  signalHypothesis: 'Hiring AEs means scaling',
  keywords: [],
  locations: [],
  sources: [],
  isActive: true,
  lastRunAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function posting(id: string): IngestedPosting {
  return {
    id,
    company: 'Acme',
    title: 'Account Executive',
    location: null,
    url: 'u',
    postedAt: null,
    description: 'd',
  };
}

function evaluation(isMatch: boolean): SignalEvaluation {
  return {
    isMatch,
    confidence: isMatch ? 82 : 10,
    category: isMatch ? 'team_expansion' : 'not_a_match',
    reasoning: 'r',
    likelyNeed: 'n',
    suggestedAngle: 'a',
  };
}

function makeService() {
  const signals = {
    findEvaluatedPostingIds: jest.fn().mockResolvedValue(new Set<string>()),
    create: jest.fn().mockResolvedValue({}),
    findById: jest.fn(),
    attachOutreach: jest.fn().mockResolvedValue({ id: 's1', isMatch: true }),
    updateStatus: jest.fn(),
    listByUser: jest.fn(),
  };
  const trackers = {
    findById: jest.fn().mockResolvedValue(TRACKER),
    markRun: jest.fn().mockResolvedValue(undefined),
  };
  const ingestion = { ingestForSources: jest.fn().mockResolvedValue([]) };
  const credits = {
    debit: jest.fn().mockResolvedValue(49),
    grant: jest.fn().mockResolvedValue(50),
  };
  const ai = {
    name: 'mock',
    evaluateSignal: jest.fn(),
    draftOutreach: jest.fn(),
  };

  const service = new SignalsService(
    signals as unknown as SignalRepository,
    trackers as unknown as TrackerRepository,
    ingestion as unknown as IngestionService,
    credits as unknown as CreditsService,
    ai,
  );
  return { service, signals, trackers, ingestion, credits, ai };
}

describe('SignalsService', () => {
  describe('runTracker', () => {
    it('debits, evaluates each fresh posting, and counts matches', async () => {
      const ctx = makeService();
      ctx.ingestion.ingestForSources.mockResolvedValue([
        posting('a'),
        posting('b'),
      ]);
      ctx.ai.evaluateSignal
        .mockResolvedValueOnce(evaluation(true))
        .mockResolvedValueOnce(evaluation(false));

      const result = await ctx.service.runTracker('u1', 't1');

      expect(result.evaluated).toBe(2);
      expect(result.matches).toBe(1);
      expect(result.creditsSpent).toBe(2 * CREDIT_COSTS.signalEvaluation);
      expect(ctx.signals.create).toHaveBeenCalledTimes(2);
      expect(ctx.trackers.markRun).toHaveBeenCalledWith('t1');
    });

    it('stops cleanly when credits run out', async () => {
      const ctx = makeService();
      ctx.ingestion.ingestForSources.mockResolvedValue([
        posting('a'),
        posting('b'),
      ]);
      ctx.credits.debit.mockRejectedValueOnce(
        new InsufficientCreditsException(),
      );

      const result = await ctx.service.runTracker('u1', 't1');

      expect(result.skippedInsufficientCredits).toBe(true);
      expect(result.evaluated).toBe(0);
      expect(ctx.ai.evaluateSignal).not.toHaveBeenCalled();
    });

    it('refunds the credit when an evaluation fails', async () => {
      const ctx = makeService();
      ctx.ingestion.ingestForSources.mockResolvedValue([posting('a')]);
      ctx.ai.evaluateSignal.mockRejectedValue(new Error('model error'));

      const result = await ctx.service.runTracker('u1', 't1');

      expect(result.evaluated).toBe(0);
      expect(result.creditsSpent).toBe(0);
      expect(ctx.credits.grant).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateOutreach', () => {
    it('rejects outreach for a non-matching signal', async () => {
      const ctx = makeService();
      ctx.signals.findById.mockResolvedValue({
        id: 's1',
        isMatch: false,
        trackerId: 't1',
      });

      await expect(
        ctx.service.generateOutreach('u1', 's1', { tone: 'consultative' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(ctx.credits.debit).not.toHaveBeenCalled();
    });

    it('debits and drafts outreach for a matching signal', async () => {
      const ctx = makeService();
      ctx.signals.findById.mockResolvedValue({
        id: 's1',
        isMatch: true,
        trackerId: 't1',
        company: 'Acme',
        title: 'Account Executive',
        category: 'team_expansion',
        likelyNeed: 'n',
        suggestedAngle: 'a',
      });
      ctx.ai.draftOutreach.mockResolvedValue({
        subject: 's',
        body: 'b',
        followUp: 'f',
      });

      await ctx.service.generateOutreach('u1', 's1', { tone: 'consultative' });

      expect(ctx.credits.debit).toHaveBeenCalledWith(
        'u1',
        CREDIT_COSTS.outreachDraft,
        'outreach_draft',
        's1',
      );
      expect(ctx.ai.draftOutreach).toHaveBeenCalledTimes(1);
      expect(ctx.signals.attachOutreach).toHaveBeenCalledTimes(1);
    });
  });
});
