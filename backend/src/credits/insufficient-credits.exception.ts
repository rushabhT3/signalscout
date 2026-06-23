import { HttpException, HttpStatus } from '@nestjs/common';

export class InsufficientCreditsException extends HttpException {
  constructor() {
    super(
      {
        code: 'insufficient_credits',
        message:
          'Not enough credits for this action. Upgrade to Pro or wait for your monthly reset.',
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
