import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { CreditAccount, CreditLedgerEntry } from "@signalscout/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { SUPABASE_JWT_SECURITY } from "../common/swagger";
import { CreditsService } from "./credits.service";

@ApiTags("credits")
@ApiBearerAuth(SUPABASE_JWT_SECURITY)
@Controller({ path: "credits", version: "1" })
export class CreditsController {
  constructor(private readonly credits: CreditsService) {}

  @Get()
  @ApiOperation({ summary: "Get the current user's credit account" })
  getAccount(@CurrentUser() user: AuthenticatedUser): Promise<CreditAccount> {
    return this.credits.getAccount(user.id);
  }

  @Get("ledger")
  @ApiOperation({ summary: "List recent credit ledger entries" })
  getLedger(@CurrentUser() user: AuthenticatedUser): Promise<CreditLedgerEntry[]> {
    return this.credits.listLedger(user.id);
  }
}
