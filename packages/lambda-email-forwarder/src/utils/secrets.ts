import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export async function getSecret(secretName: string): Promise<any> {
  const client = new SecretsManagerClient({});
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  
  if (!response.SecretString) {
    throw new Error(`Secret ${secretName} has no string value`);
  }
  
  return JSON.parse(response.SecretString);
}
