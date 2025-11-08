import { S3Service } from './s3-service';
import { GmailService } from './gmail-service';
import { EmailParserService } from './email-parser-service';

export class EmailForwarderService {
  constructor(
    private s3Service: S3Service,
    private gmailService: GmailService,
    private emailParser: EmailParserService,
    private gmailUser: string
  ) {}

  async forwardEmail(bucket: string, key: string): Promise<void> {
    const rawEmail = await this.s3Service.getEmailFromS3(bucket, key);
    const parsed = await this.emailParser.parseMime(rawEmail);

    await this.gmailService.sendEmail({
      from: this.gmailUser,
      to: [this.gmailUser],
      subject: `Fwd: ${parsed.headers.subject}`,
      body: `From: ${parsed.headers.from}\n\n${parsed.body}`,
    });

    await this.s3Service.deleteEmailFromS3(bucket, key);
  }
}
