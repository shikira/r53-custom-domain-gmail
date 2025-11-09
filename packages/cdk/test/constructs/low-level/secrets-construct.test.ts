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

  it('references existing secrets', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    new SecretsConstruct(stack, 'TestSecrets');
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::SecretsManager::Secret', 0);
  });

  it('references Gmail API secret', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    const construct = new SecretsConstruct(stack, 'TestSecrets');

    expect(construct.gmailApiSecret).toBeDefined();
    expect(construct.gmailApiSecret.secretName).toBe('gmail-api-credentials');
  });

  it('references SES SMTP secret', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    const construct = new SecretsConstruct(stack, 'TestSecrets');

    expect(construct.sesSmtpSecret).toBeDefined();
    expect(construct.sesSmtpSecret.secretName).toBe('ses-smtp-credentials');
  });
});
