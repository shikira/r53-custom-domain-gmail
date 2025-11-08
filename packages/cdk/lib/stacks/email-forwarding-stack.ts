import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecretsConstruct } from '../constructs/low-level/secrets-construct';
import { IamRolesConstruct } from '../constructs/low-level/iam-roles-construct';
import { EmailReceivingConstruct } from '../constructs/high-level/email-receiving-construct';

export class EmailForwardingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const secrets = new SecretsConstruct(this, 'Secrets');

    const emailReceiving = new EmailReceivingConstruct(this, 'EmailReceiving', {
      domainName: process.env.DOMAIN_NAME || 'example.com',
    });

    new IamRolesConstruct(this, 'IamRoles', {
      bucketArn: emailReceiving.bucket.bucket.bucketArn,
      gmailApiSecretArn: secrets.gmailApiSecret.secretArn,
      sesSmtpSecretArn: secrets.sesSmtpSecret.secretArn,
    });
  }
}
