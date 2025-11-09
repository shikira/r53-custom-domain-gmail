import { Construct } from 'constructs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { RemovalPolicy } from 'aws-cdk-lib';
import { NagSuppressions } from 'cdk-nag';

export class SecretsConstruct extends Construct {
  public readonly gmailApiSecret: secretsmanager.ISecret;
  public readonly sesSmtpSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.gmailApiSecret = secretsmanager.Secret.fromSecretNameV2(this, 'GmailApiSecret', 'gmail-api-credentials');

    this.sesSmtpSecret = secretsmanager.Secret.fromSecretNameV2(this, 'SesSmtpSecret', 'ses-smtp-credentials');

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
