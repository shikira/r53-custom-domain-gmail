import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, it, expect } from 'vitest';
import { SecretsConstruct } from '../../../lib/constructs/low-level/secrets-construct';

describe('SecretsConstruct', () => {
  it('matches snapshot', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    new SecretsConstruct(stack, 'TestSecrets');
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });

  it('creates two secrets', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    new SecretsConstruct(stack, 'TestSecrets');
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::SecretsManager::Secret', 2);
  });

  it('creates Gmail API secret', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    new SecretsConstruct(stack, 'TestSecrets');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'email-forwarding/gmail-api-credentials',
    });
  });

  it('creates SES SMTP secret', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    new SecretsConstruct(stack, 'TestSecrets');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'email-forwarding/ses-smtp-credentials',
    });
  });
});
