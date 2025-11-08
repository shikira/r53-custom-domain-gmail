import { GmailClient } from '../infrastructure/gmail-client';
import { EmailMessage } from '../types/email';

export class GmailService {
  constructor(private gmailClient: GmailClient) {}

  async sendEmail(message: EmailMessage): Promise<void> {
    await this.gmailClient.sendMessage(message);
  }
}
