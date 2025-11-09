import { App, Stack } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { describe, it, expect } from 'vitest';
import { IamRolesConstruct } from '../../../lib/constructs/low-level/iam-roles-construct';

describe('IamRolesConstruct', () => {
  it('matches snapshot', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    new IamRolesConstruct(stack, 'TestRoles', {
      bucketArn: 'arn:aws:s3:::test-bucket',
      gmailApiSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:gmail',
      sesSmtpSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:ses',
    });
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });

  it('creates Lambda execution role', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    new IamRolesConstruct(stack, 'TestRoles', {
      bucketArn: 'arn:aws:s3:::test-bucket',
      gmailApiSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:gmail',
      sesSmtpSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:ses',
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
          }),
        ]),
      },
    });
  });

  it('has S3 read permissions', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    new IamRolesConstruct(stack, 'TestRoles', {
      bucketArn: 'arn:aws:s3:::test-bucket',
      gmailApiSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:gmail',
      sesSmtpSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:ses',
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: ['s3:GetObject', 's3:DeleteObject'],
            Effect: 'Allow',
            Resource: 'arn:aws:s3:::test-bucket/*',
          }),
        ]),
      },
    });
  });

  it('has Secrets Manager read permissions', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    new IamRolesConstruct(stack, 'TestRoles', {
      bucketArn: 'arn:aws:s3:::test-bucket',
      gmailApiSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:gmail',
      sesSmtpSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:ses',
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 'secretsmanager:GetSecretValue',
            Effect: 'Allow',
          }),
        ]),
      },
    });
  });
});
