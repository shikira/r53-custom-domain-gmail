import { App, Stack } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { describe, it, expect } from 'vitest';
import { S3BucketConstruct } from '../../../lib/constructs/low-level/s3-bucket-construct';

describe('S3BucketConstruct', () => {
  it('matches snapshot', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    new S3BucketConstruct(stack, 'TestBucket', { domainName: 'example.com' });
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });

  it('has encryption enabled', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    new S3BucketConstruct(stack, 'TestBucket', { domainName: 'example.com' });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          { ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } },
        ],
      },
    });
  });

  it('blocks public access', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    new S3BucketConstruct(stack, 'TestBucket', { domainName: 'example.com' });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it('has lifecycle rule for incoming prefix', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    new S3BucketConstruct(stack, 'TestBucket', { domainName: 'example.com' });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: Match.arrayWith([
          Match.objectLike({
            ExpirationInDays: 7,
            Prefix: 'incoming/',
            Status: 'Enabled',
          }),
        ]),
      },
    });
  });

  it('has bucket policy for SES', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    new S3BucketConstruct(stack, 'TestBucket', { domainName: 'example.com' });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 's3:PutObject',
            Effect: 'Allow',
            Principal: { Service: 'ses.amazonaws.com' },
          }),
        ]),
      },
    });
  });

  it('enforces SSL/TLS', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    new S3BucketConstruct(stack, 'TestBucket', { domainName: 'example.com' });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 's3:*',
            Effect: 'Deny',
            Condition: { Bool: { 'aws:SecureTransport': 'false' } },
          }),
        ]),
      },
    });
  });
});
