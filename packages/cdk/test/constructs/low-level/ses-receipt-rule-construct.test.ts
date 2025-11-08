import { describe, it, expect } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { SesReceiptRuleConstruct } from '../../../lib/constructs/low-level/ses-receipt-rule-construct';

describe('SesReceiptRuleConstruct', () => {
  it('should create SES receipt rule set and rule', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    const bucket = new s3.Bucket(stack, 'TestBucket');
    const role = new iam.Role(stack, 'TestRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    const fn = new lambda.Function(stack, 'TestLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
      role,
    });

    new SesReceiptRuleConstruct(stack, 'TestSesReceiptRule', {
      domainName: 'example.com',
      bucket,
      lambdaFunction: fn,
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::SES::ReceiptRuleSet', 1);
    template.resourceCountIs('AWS::SES::ReceiptRule', 1);

    template.hasResourceProperties('AWS::SES::ReceiptRuleSet', {
      RuleSetName: 'example.com-rule-set',
    });

    template.hasResourceProperties('AWS::SES::ReceiptRule', {
      Rule: {
        Recipients: ['example.com'],
        ScanEnabled: true,
        TlsPolicy: 'Require',
        Enabled: true,
      },
    });
  });

  it('should match snapshot', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    const bucket = new s3.Bucket(stack, 'TestBucket');
    const role = new iam.Role(stack, 'TestRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    const fn = new lambda.Function(stack, 'TestLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
      role,
    });

    new SesReceiptRuleConstruct(stack, 'TestSesReceiptRule', {
      domainName: 'example.com',
      bucket,
      lambdaFunction: fn,
    });

    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });
});
