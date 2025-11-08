import { describe, it, expect, beforeEach } from 'vitest';
import { S3Client } from '../../src/infrastructure/s3-client';
import { GetObjectCommand, DeleteObjectCommand, S3Client as AWSS3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { sdkStreamMixin } from '@smithy/util-stream';
import { Readable } from 'stream';

const s3Mock = mockClient(AWSS3Client);

describe('S3Client', () => {
  let s3Client: S3Client;

  beforeEach(() => {
    s3Client = new S3Client();
    s3Mock.reset();
  });

  describe('getObject', () => {
    it('should retrieve object from S3', async () => {
      const stream = new Readable();
      stream.push('email content');
      stream.push(null);
      const sdkStream = sdkStreamMixin(stream);

      s3Mock.on(GetObjectCommand).resolves({ Body: sdkStream });

      const result = await s3Client.getObject('bucket', 'key');

      expect(result).toBe('email content');
    });

    it('should throw error when Body is missing', async () => {
      s3Mock.on(GetObjectCommand).resolves({});

      await expect(s3Client.getObject('bucket', 'key')).rejects.toThrow('Empty response body');
    });
  });

  describe('deleteObject', () => {
    it('should delete object from S3', async () => {
      s3Mock.on(DeleteObjectCommand).resolves({});

      await s3Client.deleteObject('bucket', 'key');

      expect(s3Mock.calls()).toHaveLength(1);
    });
  });
});
