import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type Stripe from 'stripe';
import { PLAN_LIMITS, type BillingSession } from '@signalscout/shared';
import { AppConfigService } from '../config/app-config.service';
import { CreditsService } from '../credits/credits.service';
import { ProfileRepository } from '../profiles/profile.repository';
import { StripeService } from './stripe.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly stripe: StripeService,
    private readonly profiles: ProfileRepository,
    private readonly credits: CreditsService,
    private readonly config: AppConfigService,
  ) {}

  async createCheckout(userId: string, email: string): Promise<BillingSession> {
    const priceId = this.requirePriceId();
    const customerId = await this.profiles.getStripeCustomerId(userId);
    const url = await this.stripe.createCheckoutSession({
      userId,
      email,
      customerId: customerId ?? undefined,
      priceId,
      successUrl: `${this.config.frontendUrl}/dashboard/billing?status=success`,
      cancelUrl: `${this.config.frontendUrl}/dashboard/billing?status=cancelled`,
    });
    return { url };
  }

  async createPortal(userId: string): Promise<BillingSession> {
    this.requirePriceId();
    const customerId = await this.profiles.getStripeCustomerId(userId);
    if (!customerId) {
      throw new BadRequestException({
        code: 'no_billing_account',
        message: 'No billing account yet — upgrade to Pro first.',
      });
    }
    const url = await this.stripe.createPortalSession(
      customerId,
      `${this.config.frontendUrl}/dashboard/billing`,
    );
    return { url };
  }

  async handleEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.onCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.syncSubscription(event.data.object);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  }

  private async onCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const userId = session.client_reference_id;
    if (!userId) {
      this.logger.warn(
        'checkout.session.completed without client_reference_id',
      );
      return;
    }

    const existing = await this.profiles.findById(userId);
    const wasAlreadyPro = existing?.planTier === 'pro';

    await this.profiles.updateBilling(userId, {
      planTier: 'pro',
      stripeCustomerId: this.toId(session.customer) ?? undefined,
      stripeSubscriptionId: this.toId(session.subscription),
      subscriptionStatus: 'active',
    });

    if (!wasAlreadyPro) {
      await this.credits.grant(
        userId,
        PLAN_LIMITS.pro.monthlyCredits,
        'plan_upgrade',
        session.id,
      );
      this.logger.log(`Upgraded ${userId} to Pro and granted credits.`);
    }
  }

  private async syncSubscription(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const customerId = this.toId(subscription.customer);
    const userId =
      subscription.metadata?.user_id ??
      (customerId ? await this.profiles.findIdByCustomerId(customerId) : null);

    if (!userId) {
      this.logger.warn(
        `Subscription ${subscription.id} could not be matched to a user.`,
      );
      return;
    }

    const isActive =
      subscription.status === 'active' || subscription.status === 'trialing';
    await this.profiles.updateBilling(userId, {
      planTier: isActive ? 'pro' : 'free',
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
    });
    this.logger.log(
      `Synced subscription for ${userId}: ${subscription.status}`,
    );
  }

  private requirePriceId(): string {
    if (!this.stripe.enabled || !this.config.stripe.proPriceId) {
      throw new ServiceUnavailableException({
        code: 'billing_disabled',
        message: 'Billing is not configured.',
      });
    }
    return this.config.stripe.proPriceId;
  }

  private toId(
    value: string | { id: string } | null | undefined,
  ): string | null {
    if (!value) {
      return null;
    }
    return typeof value === 'string' ? value : value.id;
  }
}
