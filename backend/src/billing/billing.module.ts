import { Module } from '@nestjs/common';
import { CreditsModule } from '../credits/credits.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';

@Module({
  imports: [ProfilesModule, CreditsModule],
  controllers: [BillingController],
  providers: [BillingService, StripeService],
})
export class BillingModule {}
