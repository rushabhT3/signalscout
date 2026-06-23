import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  type RawBodyRequest,
} from "@nestjs/common";
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type Stripe from "stripe";
import type { BillingSession } from "@signalscout/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { Public } from "../auth/public.decorator";
import { RawResponse } from "../common/decorators/raw-response.decorator";
import { SUPABASE_JWT_SECURITY } from "../common/swagger";
import { BillingService } from "./billing.service";
import { StripeService } from "./stripe.service";

@ApiTags("billing")
@ApiBearerAuth(SUPABASE_JWT_SECURITY)
@Controller({ path: "billing", version: "1" })
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly stripe: StripeService,
  ) {}

  @Post("checkout")
  @ApiOperation({ summary: "Create a Stripe Checkout session to upgrade to Pro" })
  createCheckout(@CurrentUser() user: AuthenticatedUser): Promise<BillingSession> {
    return this.billing.createCheckout(user.id, user.email);
  }

  @Post("portal")
  @ApiOperation({ summary: "Create a Stripe billing-portal session" })
  createPortal(@CurrentUser() user: AuthenticatedUser): Promise<BillingSession> {
    return this.billing.createPortal(user.id);
  }

  @Post("webhook")
  @Public()
  @RawResponse()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async webhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,
  ): Promise<{ received: true }> {
    if (!signature || !request.rawBody) {
      throw new BadRequestException({
        code: "invalid_request",
        message: "Missing Stripe signature or request body.",
      });
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.constructEvent(request.rawBody, signature);
    } catch {
      throw new BadRequestException({
        code: "invalid_signature",
        message: "Invalid Stripe signature.",
      });
    }

    await this.billing.handleEvent(event);
    return { received: true };
  }
}
