import { describe, it, expect } from 'vitest';
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LambdaFunctionConstruct } from '../../../lib/constructs/low-level/lambda-function-construct';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

describe('LambdaFunctionConstruct', () => {
  it('should create Lambda function with correct configuration', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');

    const role = new iam.Role(stack, 'TestRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    const bucket = new s3.Bucket(stack, 'TestBucket');

    new LambdaFunctionConstruct(stack, 'TestLambda', {
      executionRole: role,
      emailBucket: bucket,
      gmailUser: 'test@gmail.com',
      logLevel: 'DEBUG',
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs20.x',
      Handler: 'index.handler',
      MemorySize: 512,
      Timeout: 30,
      ReservedConcurrentExecutions: 10,
      Environment: {
        Variables: {
          GMAIL_USER: 'test@gmail.com',
          LOG_LEVEL: 'DEBUG',
        },
      },
    });
  });

  it('should match snapshot', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');

    const role = new iam.Role(stack, 'TestRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    const bucket = new s3.Bucket(stack, 'TestBucket');

    new LambdaFunctionConstruct(stack, 'TestLambda', {
      executionRole: role,
      emailBucket: bucket,
      gmailUser: 'test@gmail.com',
    });

    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });
});
