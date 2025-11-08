import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecretsConstruct } from '../constructs/secrets-construct';
import { IamRolesConstruct } from '../constructs/iam-roles-construct';
import { S3BucketConstruct } from '../constructs/s3-bucket-construct';

export class EmailForwardingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const secrets = new SecretsConstruct(this, 'Secrets');

    const s3Bucket = new S3BucketConstruct(this, 'S3Bucket', {
      sesRegion: this.region,
      accountId: this.account,
    });

    new IamRolesConstruct(this, 'IamRoles', {
      bucketArn: s3Bucket.bucket.bucketArn,
      gmailApiSecretArn: secrets.gmailApiSecret.secretArn,
      sesSmtpSecretArn: secrets.sesSmtpSecret.secretArn,
    });
  }
}
