import { describe, it, expect, beforeEach } from 'vitest';
import { getSecret } from '../../src/utils/secrets';
import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { mockClient } from 'aws-sdk-client-mock';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

const secretsMock = mockClient(SecretsManagerClient);

describe('secrets', () => {
  beforeEach(() => {
    secretsMock.reset();
  });

  describe('getSecret', () => {
    it('should retrieve secret from Secrets Manager', async () => {
      secretsMock.on(GetSecretValueCommand).resolves({
        SecretString: JSON.stringify({ key: 'value' }),
      });

      const result = await getSecret('secret-name');

      expect(result).toEqual({ key: 'value' });
    });

    it('should throw error when SecretString is missing', async () => {
      secretsMock.on(GetSecretValueCommand).resolves({});

      await expect(getSecret('secret-name')).rejects.toThrow('Secret secret-name has no string value');
    });
  });
});
