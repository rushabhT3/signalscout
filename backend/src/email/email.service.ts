import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { AppConfigService } from '../config/app-config.service';
import { digestEmail, welcomeEmail, type EmailContent } from './templates';

/**
 * Thin wrapper over Resend. Email failures never break the calling flow, and the
 * service is a graceful no-op when RESEND_API_KEY / EMAIL_FROM are unset.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly client: Resend | null;
  private readonly from: string | undefined;

  constructor(config: AppConfigService) {
    const { apiKey, from } = config.email;
    this.client = apiKey ? new Resend(apiKey) : null;
    this.from = from;
  }

  get enabled(): boolean {
    return this.client !== null && Boolean(this.from);
  }

  sendWelcome(
    to: string,
    name: string | null,
    dashboardUrl: string,
  ): Promise<void> {
    return this.send(to, welcomeEmail(name, dashboardUrl));
  }

  sendDigest(
    to: string,
    newMatches: number,
    dashboardUrl: string,
  ): Promise<void> {
    return this.send(to, digestEmail(newMatches, dashboardUrl));
  }

  private async send(to: string, content: EmailContent): Promise<void> {
    if (!this.client || !this.from) {
      this.logger.debug(
        `Email disabled; skipped "${content.subject}" to ${to}`,
      );
      return;
    }
    const { error } = await this.client.emails.send({
      from: this.from,
      to,
      subject: content.subject,
      html: content.html,
    });
    if (error) {
      this.logger.error(
        `Failed to send "${content.subject}" to ${to}: ${error.message}`,
      );
    }
  }
}
