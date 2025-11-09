import { Construct } from 'constructs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { RemovalPolicy } from 'aws-cdk-lib';
import { NagSuppressions } from 'cdk-nag';

export class SecretsConstruct extends Construct {
  public readonly gmailApiSecret: secretsmanager.Secret;
  public readonly sesSmtpSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.gmailApiSecret = new secretsmanager.Secret(this, 'GmailApiSecret', {
      secretName: 'gmail-api-credentials',
      description: 'Gmail API OAuth2 credentials for email forwarding',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.sesSmtpSecret = new secretsmanager.Secret(this, 'SesSmtpSecret', {
      secretName: 'ses-smtp-credentials',
      description: 'SES SMTP credentials for sending emails',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    NagSuppressions.addResourceSuppressions(
      [this.gmailApiSecret, this.sesSmtpSecret],
      [
        {
          id: 'AwsSolutions-SMG4',
          reason: 'Manual credential rotation is acceptable for this use case',
        },
      ],
      true
    );
  }
}
