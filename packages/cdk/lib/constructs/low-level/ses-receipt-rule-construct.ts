import * as cdk from 'aws-cdk-lib';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as actions from 'aws-cdk-lib/aws-ses-actions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
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
  }
}
