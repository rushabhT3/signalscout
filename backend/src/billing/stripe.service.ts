import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import Stripe from "stripe";
import { AppConfigService } from "../config/app-config.service";

export interface CheckoutParams {
  userId: string;
  email: string;
  customerId?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

@Injectable()
export class StripeService {
  private readonly client: Stripe | null;

  constructor(private readonly config: AppConfigService) {
    const { secretKey } = this.config.stripe;
    this.client = secretKey
      ? new Stripe(secretKey, { apiVersion: "2026-05-27.dahlia" })
      : null;
  }

  get enabled(): boolean {
    return this.client !== null;
  }

  async createCheckoutSession(params: CheckoutParams): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: params.priceId, quantity: 1 }],
      customer: params.customerId,
      customer_email: params.customerId ? undefined : params.email,
      client_reference_id: params.userId,
      subscription_data: { metadata: { user_id: params.userId } },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }
    return session.url;
  }

  async createPortalSession(customerId: string, returnUrl: string): Promise<string> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session.url;
  }

  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    const secret = this.config.stripe.webhookSecret;
    if (!secret) {
      throw new ServiceUnavailableException({
        code: "billing_disabled",
        message: "Stripe webhook secret is not configured.",
      });
    }
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }

  private get stripe(): Stripe {
    if (!this.client) {
      throw new ServiceUnavailableException({
        code: "billing_disabled",
        message: "Billing is not configured.",
      });
    }
    return this.client;
  }
}
