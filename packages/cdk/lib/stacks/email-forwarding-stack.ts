import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { SecretsConstruct } from '../constructs/low-level/secrets-construct';
import { IamRolesConstruct } from '../constructs/low-level/iam-roles-construct';
import { EmailReceivingConstruct } from '../constructs/high-level/email-receiving-construct';
import { LambdaFunctionConstruct } from '../constructs/low-level/lambda-function-construct';
import { SesReceiptRuleConstruct } from '../constructs/low-level/ses-receipt-rule-construct';
import { SesDomainConstruct } from '../constructs/low-level/ses-domain-construct';

export class EmailForwardingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = process.env.DOMAIN_NAME || 'example.com';
    const gmailUser = process.env.GMAIL_USER || 'user@gmail.com';

    // Lookup existing hosted zone
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName,
    });

    const secrets = new SecretsConstruct(this, 'Secrets');

    // SES domain verification
    new SesDomainConstruct(this, 'SesDomain', {
      domainName,
      hostedZone,
    });

    const emailReceiving = new EmailReceivingConstruct(this, 'EmailReceiving', {
      domainName,
    });

    const iamRoles = new IamRolesConstruct(this, 'IamRoles', {
      bucketArn: emailReceiving.bucket.bucket.bucketArn,
      gmailApiSecretArn: secrets.gmailApiSecret.secretArn,
      sesSmtpSecretArn: secrets.sesSmtpSecret.secretArn,
    });

    const lambdaFunction = new LambdaFunctionConstruct(this, 'LambdaFunction', {
      executionRole: iamRoles.lambdaExecutionRole,
      emailBucket: emailReceiving.bucket.bucket,
      gmailUser,
    });

    new SesReceiptRuleConstruct(this, 'SesReceiptRule', {
      domainName,
      bucket: emailReceiving.bucket.bucket,
      lambdaFunction: lambdaFunction.function,
    });
  }
}
