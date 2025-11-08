import { describe, it, expect } from 'vitest';
import { EmailParserService } from '../../src/services/email-parser-service';

describe('EmailParserService', () => {
  let emailParser: EmailParserService;

  beforeEach(() => {
    emailParser = new EmailParserService();
  });

  describe('parseMime', () => {
    it('should parse simple email', async () => {
      const rawEmail = 'From: sender@example.com\nTo: recipient@example.com\nSubject: Test\n\nBody content';

      const result = await emailParser.parseMime(rawEmail);

      expect(result.headers.from).toBe('sender@example.com');
      expect(result.headers.to).toContain('recipient@example.com');
      expect(result.headers.subject).toBe('Test');
      expect(result.body).toContain('Body content');
    });

    it('should parse email with HTML', async () => {
      const rawEmail = 'From: sender@example.com\nSubject: HTML Test\nContent-Type: text/html\n\n<p>HTML body</p>';

      const result = await emailParser.parseMime(rawEmail);

      expect(result.headers.subject).toBe('HTML Test');
      expect(result.html).toContain('HTML body');
    });

    it('should handle missing headers', async () => {
      const rawEmail = 'Body only';

      const result = await emailParser.parseMime(rawEmail);

      expect(result.headers.from).toBe('');
      expect(result.headers.subject).toBe('');
    });

    it('should extract attachments', async () => {
      const rawEmail = 'From: sender@example.com\nSubject: With Attachment\nContent-Type: multipart/mixed; boundary="boundary"\n\n--boundary\nContent-Type: text/plain\n\nBody\n--boundary\nContent-Type: application/pdf\nContent-Disposition: attachment; filename="test.pdf"\n\nPDF content\n--boundary--';

      const result = await emailParser.parseMime(rawEmail);

      expect(result.attachments.length).toBeGreaterThan(0);
    });
  });
});
