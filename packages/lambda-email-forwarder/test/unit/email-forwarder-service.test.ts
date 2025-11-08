import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailForwarderService } from '../../src/services/email-forwarder-service';
import { S3Service } from '../../src/services/s3-service';
import { GmailService } from '../../src/services/gmail-service';
import { EmailParserService } from '../../src/services/email-parser-service';

vi.mock('../../src/services/s3-service');
vi.mock('../../src/services/gmail-service');
vi.mock('../../src/services/email-parser-service');

describe('EmailForwarderService', () => {
  let emailForwarder: EmailForwarderService;
  let mockS3Service: S3Service;
  let mockGmailService: GmailService;
  let mockEmailParser: EmailParserService;

  beforeEach(() => {
    mockS3Service = new S3Service({} as any);
    mockGmailService = new GmailService({} as any);
    mockEmailParser = new EmailParserService();
    emailForwarder = new EmailForwarderService(
      mockS3Service,
      mockGmailService,
      mockEmailParser,
      'user@gmail.com'
    );
    vi.clearAllMocks();
  });

  describe('forwardEmail', () => {
    it('should forward email successfully', async () => {
      const rawEmail = 'From: sender@example.com\nSubject: Test\n\nBody';
      const parsedEmail = {
        headers: { from: 'sender@example.com', to: ['user@example.com'], subject: 'Test' },
        body: 'Body',
        attachments: [],
      };

      vi.mocked(mockS3Service.getEmailFromS3).mockResolvedValue(rawEmail);
      vi.mocked(mockEmailParser.parseMime).mockResolvedValue(parsedEmail);
      vi.mocked(mockGmailService.sendEmail).mockResolvedValue('message-id');
      vi.mocked(mockS3Service.deleteEmailFromS3).mockResolvedValue();

      await emailForwarder.forwardEmail('bucket', 'key');

      expect(mockS3Service.getEmailFromS3).toHaveBeenCalledWith('bucket', 'key');
      expect(mockEmailParser.parseMime).toHaveBeenCalledWith(rawEmail);
      expect(mockGmailService.sendEmail).toHaveBeenCalledWith({
        from: 'user@gmail.com',
        to: ['user@gmail.com'],
        subject: 'Fwd: Test',
        body: 'From: sender@example.com\n\nBody',
      });
      expect(mockS3Service.deleteEmailFromS3).toHaveBeenCalledWith('bucket', 'key');
    });

    it('should throw error when S3 retrieval fails', async () => {
      vi.mocked(mockS3Service.getEmailFromS3).mockRejectedValue(new Error('S3 error'));

      await expect(emailForwarder.forwardEmail('bucket', 'key')).rejects.toThrow('S3 error');
      expect(mockS3Service.deleteEmailFromS3).not.toHaveBeenCalled();
    });

    it('should throw error when email parsing fails', async () => {
      vi.mocked(mockS3Service.getEmailFromS3).mockResolvedValue('raw email');
      vi.mocked(mockEmailParser.parseMime).mockRejectedValue(new Error('Parse error'));

      await expect(emailForwarder.forwardEmail('bucket', 'key')).rejects.toThrow('Parse error');
      expect(mockS3Service.deleteEmailFromS3).not.toHaveBeenCalled();
    });

    it('should throw error when Gmail sending fails', async () => {
      const parsedEmail = {
        headers: { from: 'sender@example.com', to: ['user@example.com'], subject: 'Test' },
        body: 'Body',
        attachments: [],
      };

      vi.mocked(mockS3Service.getEmailFromS3).mockResolvedValue('raw email');
      vi.mocked(mockEmailParser.parseMime).mockResolvedValue(parsedEmail);
      vi.mocked(mockGmailService.sendEmail).mockRejectedValue(new Error('Gmail error'));

      await expect(emailForwarder.forwardEmail('bucket', 'key')).rejects.toThrow('Gmail error');
      expect(mockS3Service.deleteEmailFromS3).not.toHaveBeenCalled();
    });
  });
});
