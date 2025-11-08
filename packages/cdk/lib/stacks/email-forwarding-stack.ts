import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecretsConstruct } from '../constructs/secrets-construct';
import { IamRolesConstruct } from '../constructs/iam-roles-construct';

export class EmailForwardingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const secrets = new SecretsConstruct(this, 'Secrets');

    new IamRolesConstruct(this, 'IamRoles', {
      bucketArn: 'arn:aws:s3:::placeholder-bucket',
      secretArn: secrets.gmailApiSecret.secretArn,
    });
  }
}
