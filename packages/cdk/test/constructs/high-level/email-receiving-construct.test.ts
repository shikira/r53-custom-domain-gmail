import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, it, expect } from 'vitest';
import { EmailReceivingConstruct } from '../../../lib/constructs/high-level/email-receiving-construct';

describe('EmailReceivingConstruct', () => {
  it('matches snapshot', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    new EmailReceivingConstruct(stack, 'TestReceiving', {
      domainName: 'example.com',
    });
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });

  it('creates S3 bucket', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    new EmailReceivingConstruct(stack, 'TestReceiving', {
      domainName: 'example.com',
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::S3::Bucket', 1);
  });
});
