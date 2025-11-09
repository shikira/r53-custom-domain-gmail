import type { SESEvent, Context } from 'aws-lambda';
import { S3Client } from './infrastructure/s3-client';
import { GmailClient } from './infrastructure/gmail-client';
import { S3Service } from './services/s3-service';
import { GmailService } from './services/gmail-service';
import { EmailParserService } from './services/email-parser-service';
import { EmailForwarderService } from './services/email-forwarder-service';
import { getSecret } from './utils/secrets';
import { Logger } from './utils/logger';

const logger = new Logger('EmailForwarder');

export const handler = async (event: SESEvent, context: Context): Promise<void> => {
  try {
    logger.info('Processing SES event', { requestId: context.requestId, event: JSON.stringify(event, null, 2) });

    const gmailUser = process.env.GMAIL_USER;
    if (!gmailUser) {
      throw new Error('GMAIL_USER environment variable not set');
    }

    const gmailCredentials = await getSecret('gmail-api-credentials');
    
    const s3Client = new S3Client();
    const gmailClient = new GmailClient();
    await gmailClient.authenticate(gmailCredentials);

    const s3Service = new S3Service(s3Client);
    const gmailService = new GmailService(gmailClient);
    const emailParser = new EmailParserService();
    const forwarder = new EmailForwarderService(s3Service, gmailService, emailParser, gmailUser);

    for (const record of event.Records) {
      // Find S3 action in the receipt actions
      const s3Action = record.ses.receipt.action;
      let bucket: string | undefined;
      let key: string | undefined;
      
      if (s3Action && 'bucketName' in s3Action && 'objectKey' in s3Action) {
        bucket = s3Action.bucketName;
        key = s3Action.objectKey;
      } else {
        // Fallback: use environment variable for bucket
        bucket = process.env.S3_BUCKET;
        // Extract key from message ID or use a default pattern
        key = `incoming/${record.ses.mail.messageId}`;
      }
      
      if (!bucket || !key) {
        logger.error('Missing S3 bucket or key', { bucket, key, record });
        throw new Error('Unable to determine S3 bucket and key from SES event');
      }
      
      logger.info('Forwarding email', { bucket, key });
      await forwarder.forwardEmail(bucket, key);
      logger.info('Email forwarded successfully', { bucket, key });
    }
  } catch (error) {
    logger.error('Failed to forward email', error);
    throw error;
  }
};
