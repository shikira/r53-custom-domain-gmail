import { google } from 'googleapis';
import { EmailMessage } from '../types/email';

export class GmailClient {
  private gmail: any;

  async authenticate(credentials: any): Promise<void> {
    const auth = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      credentials.redirect_uri
    );
    auth.setCredentials({ refresh_token: credentials.refresh_token });
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  async sendMessage(message: EmailMessage): Promise<void> {
    const raw = this.createRawMessage(message);
    await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
  }

  private createRawMessage(message: EmailMessage): string {
    const lines = [
      `From: ${message.from}`,
      `To: ${message.to.join(', ')}`,
      `Subject: ${message.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      '',
      message.body,
    ];
    return Buffer.from(lines.join('\r\n')).toString('base64url');
  }
}
