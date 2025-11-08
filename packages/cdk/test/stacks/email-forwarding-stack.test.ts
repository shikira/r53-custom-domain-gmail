import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, it, expect } from 'vitest';
import { EmailForwardingStack } from '../../lib/stacks/email-forwarding-stack';

describe('EmailForwardingStack', () => {
  it('matches snapshot', () => {
    const app = new App();
    const stack = new EmailForwardingStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });

  it('creates expected number of resources', () => {
    const app = new App();
    const stack = new EmailForwardingStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.resourceCountIs('AWS::IAM::Role', 2);
    template.resourceCountIs('AWS::SecretsManager::Secret', 2);
  });
});
