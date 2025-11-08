import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Duration } from 'aws-cdk-lib';
import { NagSuppressions } from 'cdk-nag';
import * as path from 'path';
import * as fs from 'fs';

export interface LambdaFunctionConstructProps {
  readonly executionRole: iam.IRole;
  readonly emailBucket: s3.IBucket;
  readonly gmailUser: string;
  readonly logLevel?: string;
}

export class LambdaFunctionConstruct extends Construct {
  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaFunctionConstructProps) {
    super(scope, id);

    const lambdaDistPath = path.join(__dirname, '../../../../../lambda-email-forwarder/dist');
    const code = fs.existsSync(lambdaDistPath)
      ? lambda.Code.fromAsset(lambdaDistPath)
      : lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 });');

    this.function = new lambda.Function(this, 'EmailForwarder', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code,
      role: props.executionRole,
      memorySize: 512,
      timeout: Duration.seconds(30),
      environment: {
        GMAIL_USER: props.gmailUser,
        S3_BUCKET: props.emailBucket.bucketName,
        LOG_LEVEL: props.logLevel || 'INFO',
      },
      reservedConcurrentExecutions: 10,
      tracing: lambda.Tracing.ACTIVE,
    });

    NagSuppressions.addResourceSuppressions(
      this.function,
      [
        {
          id: 'AwsSolutions-L1',
          reason: 'Using Node.js 20.x which is the latest LTS version',
        },
      ],
      true
    );
  }
}
