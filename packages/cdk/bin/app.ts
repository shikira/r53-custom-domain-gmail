#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { EmailForwardingStack } from '../lib/stacks/email-forwarding-stack';
import * as dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

const app = new cdk.App();

new EmailForwardingStack(app, 'EmailForwardingStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));

app.synth();
