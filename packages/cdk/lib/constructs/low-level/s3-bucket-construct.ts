import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { NagSuppressions } from 'cdk-nag';

export interface S3BucketConstructProps {
  readonly domainName: string;
}

export class S3BucketConstruct extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3BucketConstructProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);

    this.bucket = new s3.Bucket(this, 'EmailBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteIncomingEmailsAfter7Days',
          prefix: 'incoming/',
          expiration: Duration.days(7),
        },
      ],
      serverAccessLogsPrefix: 'access-logs/',
    });

    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowSESPuts',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('ses.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [this.bucket.arnForObjects('incoming/*')],
        conditions: {
          StringEquals: {
            'AWS:SourceAccount': stack.account,
          },
        },
      })
    );

    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureTransport',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [this.bucket.bucketArn, this.bucket.arnForObjects('*')],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    NagSuppressions.addResourceSuppressions(
      this.bucket,
      [
        {
          id: 'AwsSolutions-S1',
          reason: 'Server access logs are enabled with serverAccessLogsPrefix',
        },
      ],
      true
    );
  }
}
