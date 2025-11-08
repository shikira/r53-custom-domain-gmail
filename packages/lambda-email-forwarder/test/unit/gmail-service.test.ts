import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GmailService } from '../../src/services/gmail-service';
import { GmailClient } from '../../src/infrastructure/gmail-client';

vi.mock('../../src/infrastructure/gmail-client');

describe('GmailService', () => {
  let gmailService: GmailService;
  let mockGmailClient: GmailClient;

  beforeEach(() => {
    mockGmailClient = new GmailClient('credentials');
    gmailService = new GmailService(mockGmailClient);
    vi.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email via Gmail', async () => {
      const message = {
        from: 'user@gmail.com',
        to: ['recipient@example.com'],
        subject: 'Test',
        body: 'Test body',
      };
      vi.mocked(mockGmailClient.sendMessage).mockResolvedValue('message-id');

      await gmailService.sendEmail(message);

      expect(mockGmailClient.sendMessage).toHaveBeenCalledWith(message);
    });

    it('should throw error when Gmail sendMessage fails', async () => {
      const message = {
        from: 'user@gmail.com',
        to: ['recipient@example.com'],
        subject: 'Test',
        body: 'Test body',
      };
      vi.mocked(mockGmailClient.sendMessage).mockRejectedValue(new Error('Gmail error'));

      await expect(gmailService.sendEmail(message)).rejects.toThrow('Gmail error');
    });
  });
});
