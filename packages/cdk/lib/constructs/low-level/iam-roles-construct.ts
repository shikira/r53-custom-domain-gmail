import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NagSuppressions } from 'cdk-nag';

export interface IamRolesConstructProps {
  bucketArn: string;
  gmailApiSecretArn: string;
  sesSmtpSecretArn: string;
}

export class IamRolesConstruct extends Construct {
  public readonly lambdaExecutionRole: iam.Role;

  constructor(scope: Construct, id: string, props: IamRolesConstructProps) {
    super(scope, id);

    this.lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    this.lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [`${props.bucketArn}/*`],
      })
    );

    this.lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [props.gmailApiSecretArn, props.sesSmtpSecretArn],
      })
    );

    this.lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    NagSuppressions.addResourceSuppressions(
      this.lambdaExecutionRole,
      [
        {
          id: 'AwsSolutions-IAM4',
          reason: 'AWSLambdaBasicExecutionRole is required for CloudWatch Logs',
        },
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Wildcard required for S3 object access, CloudWatch Logs, and X-Ray tracing',
          appliesTo: [
            'Resource::<EmailReceivingBucketEmailBucket00424D61.Arn>/*',
            'Resource::*',
            'Action::xray:PutTraceSegments',
            'Action::xray:PutTelemetryRecords',
          ],
        },
      ],
      true
    );
  }
}
