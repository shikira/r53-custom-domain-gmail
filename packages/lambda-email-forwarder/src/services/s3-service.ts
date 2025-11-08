import { S3Client } from '../infrastructure/s3-client';

export class S3Service {
  constructor(private s3Client: S3Client) {}

  async getEmailFromS3(bucket: string, key: string): Promise<string> {
    return this.s3Client.getObject(bucket, key);
  }

  async deleteEmailFromS3(bucket: string, key: string): Promise<void> {
    await this.s3Client.deleteObject(bucket, key);
  }
}
