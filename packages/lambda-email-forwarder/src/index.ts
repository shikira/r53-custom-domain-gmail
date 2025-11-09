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
    logger.info('Processing SES event', { requestId: context.requestId });

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
      const bucket = record.ses.receipt.action.bucketName;
      const key = record.ses.receipt.action.objectKey;
      
      logger.info('Forwarding email', { bucket, key });
      await forwarder.forwardEmail(bucket, key);
      logger.info('Email forwarded successfully', { bucket, key });
    }
  } catch (error) {
    logger.error('Failed to forward email', error);
    throw error;
  }
};
