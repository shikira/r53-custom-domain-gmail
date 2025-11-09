#!/usr/bin/env node
import { google } from 'googleapis';
import { SecretsManagerClient, PutSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import * as http from 'http';
import * as fs from 'fs';
import { parse } from 'url';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const CREDENTIALS_PATH = process.argv[2];
const SECRET_NAME = 'gmail-api-credentials';
const REGION = 'us-east-1';
const REDIRECT_URI = 'http://localhost:8080';

async function authorize() {
  if (!CREDENTIALS_PATH || !fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error('Usage: node gmail-auth.js <path-to-credentials.json>');
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_id, client_secret } = credentials.web;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:', authUrl);

  const code = await new Promise<string>((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url && req.url.indexOf('/?code=') > -1) {
        const qs = parse(req.url, true).query;
        res.end('Authentication successful! Please return to the console.');
        server.close();
        resolve(qs.code as string);
      }
    });
    server.listen(8080, () => {
      console.log('Listening on port 8080...');
    });
  });

  const { tokens } = await oauth2Client.getToken(code);
  
  const secretValue = JSON.stringify({
    client_id,
    client_secret,
    refresh_token: tokens.refresh_token,
  });

  const client = new SecretsManagerClient({ region: REGION });
  await client.send(new PutSecretValueCommand({
    SecretId: SECRET_NAME,
    SecretString: secretValue,
  }));

  console.log('Token stored in Secrets Manager successfully!');
}

authorize().catch(console.error);
