import * as cdk from 'aws-cdk-lib';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as actions from 'aws-cdk-lib/aws-ses-actions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';

export interface SesReceiptRuleConstructProps {
  readonly domainName: string;
  readonly bucket: s3.IBucket;
  readonly lambdaFunction: lambda.IFunction;
}

export class SesReceiptRuleConstruct extends Construct {
  public readonly ruleSet: ses.ReceiptRuleSet;
  public readonly rule: ses.ReceiptRule;

  constructor(scope: Construct, id: string, props: SesReceiptRuleConstructProps) {
    super(scope, id);

    this.ruleSet = new ses.ReceiptRuleSet(this, 'RuleSet', {
      receiptRuleSetName: `${props.domainName}-rule-set`,
    });

    this.rule = this.ruleSet.addRule('Rule', {
      recipients: [props.domainName],
      scanEnabled: true,
      tlsPolicy: ses.TlsPolicy.REQUIRE,
      actions: [
        new actions.S3({
          bucket: props.bucket,
          objectKeyPrefix: 'incoming/',
        }),
        new actions.Lambda({
          function: props.lambdaFunction,
        }),
      ],
    });

    // Activate the rule set
    new cr.AwsCustomResource(this, 'ActivateRuleSet', {
      onCreate: {
        service: 'SES',
        action: 'setActiveReceiptRuleSet',
        parameters: {
          RuleSetName: this.ruleSet.receiptRuleSetName,
        },
        region: 'us-east-1',
        physicalResourceId: cr.PhysicalResourceId.of('activate-rule-set'),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    NagSuppressions.addResourceSuppressions(
      this.ruleSet,
      [
        {
          id: 'AwsSolutions-SES4',
          reason: 'TLS is enforced via TlsPolicy.REQUIRE',
        },
      ],
      true
    );

    NagSuppressions.addResourceSuppressions(this, [
      {
        id: 'AwsSolutions-IAM4',
        reason: 'Custom resource requires managed policy for SES operations',
      },
      {
        id: 'AwsSolutions-IAM5',
        reason: 'Custom resource requires wildcard permissions for SES operations',
      },
    ]);
  }
}
