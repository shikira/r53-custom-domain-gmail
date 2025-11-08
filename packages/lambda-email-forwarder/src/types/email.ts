export interface EmailMessage {
  from: string;
  to: string[];
  subject: string;
  body: string;
  html?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface ParsedEmail {
  headers: EmailHeaders;
  body: string;
  html?: string;
  attachments: EmailAttachment[];
}

export interface EmailHeaders {
  from: string;
  to: string[];
  subject: string;
  date?: string;
  messageId?: string;
}
