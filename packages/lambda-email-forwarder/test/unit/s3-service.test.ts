import { describe, it, expect, vi, beforeEach } from 'vitest';
import { S3Service } from '../../src/services/s3-service';
import { S3Client } from '../../src/infrastructure/s3-client';

vi.mock('../../src/infrastructure/s3-client');

describe('S3Service', () => {
  let s3Service: S3Service;
  let mockS3Client: S3Client;

  beforeEach(() => {
    mockS3Client = new S3Client();
    s3Service = new S3Service(mockS3Client);
    vi.clearAllMocks();
  });

  describe('getEmailFromS3', () => {
    it('should retrieve email from S3', async () => {
      const mockEmail = 'From: test@example.com\nSubject: Test\n\nBody';
      vi.mocked(mockS3Client.getObject).mockResolvedValue(mockEmail);

      const result = await s3Service.getEmailFromS3('bucket', 'key');

      expect(result).toBe(mockEmail);
      expect(mockS3Client.getObject).toHaveBeenCalledWith('bucket', 'key');
    });

    it('should throw error when S3 getObject fails', async () => {
      vi.mocked(mockS3Client.getObject).mockRejectedValue(new Error('S3 error'));

      await expect(s3Service.getEmailFromS3('bucket', 'key')).rejects.toThrow('S3 error');
    });
  });

  describe('deleteEmailFromS3', () => {
    it('should delete email from S3', async () => {
      vi.mocked(mockS3Client.deleteObject).mockResolvedValue();

      await s3Service.deleteEmailFromS3('bucket', 'key');

      expect(mockS3Client.deleteObject).toHaveBeenCalledWith('bucket', 'key');
    });

    it('should throw error when S3 deleteObject fails', async () => {
      vi.mocked(mockS3Client.deleteObject).mockRejectedValue(new Error('Delete error'));

      await expect(s3Service.deleteEmailFromS3('bucket', 'key')).rejects.toThrow('Delete error');
    });
  });
});
