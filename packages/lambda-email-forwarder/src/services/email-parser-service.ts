import { simpleParser, ParsedMail } from 'mailparser';
import { ParsedEmail, EmailAttachment } from '../types/email';

export class EmailParserService {
  async parseMime(raw: string): Promise<ParsedEmail> {
    const parsed = await simpleParser(raw);
    return {
      headers: this.extractHeaders(parsed),
      body: parsed.text || '',
      html: parsed.html || undefined,
      attachments: this.extractAttachments(parsed),
    };
  }

  extractHeaders(parsed: ParsedMail) {
    return {
      from: parsed.from?.text || '',
      to: parsed.to?.value.map((addr) => addr.address || '') || [],
      subject: parsed.subject || '',
      date: parsed.date?.toISOString(),
      messageId: parsed.messageId,
    };
  }

  extractAttachments(parsed: ParsedMail): EmailAttachment[] {
    if (!parsed.attachments) return [];
    return parsed.attachments.map((att) => ({
      filename: att.filename || 'unnamed',
      content: att.content,
      contentType: att.contentType,
    }));
  }
}
