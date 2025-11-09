import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export async function getSecret(secretName: string): Promise<any> {
  const client = new SecretsManagerClient({});
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  
  if (!response.SecretString) {
    throw new Error(`Secret ${secretName} has no string value`);
  }
  
  try {
    return JSON.parse(response.SecretString);
  } catch (error) {
    console.error('Failed to parse secret as JSON:', {
      secretName,
      secretValue: response.SecretString,
      error: error instanceof Error ? error.message : String(error)
    });
    throw new Error(`Invalid JSON in secret ${secretName}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
