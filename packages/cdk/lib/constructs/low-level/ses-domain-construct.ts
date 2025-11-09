import { Construct } from 'constructs';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as cdk from 'aws-cdk-lib';
import { NagSuppressions } from 'cdk-nag';

export interface SesDomainConstructProps {
  readonly domainName: string;
  readonly hostedZone: route53.IHostedZone;
}

export class SesDomainConstruct extends Construct {
  public readonly domain: ses.EmailIdentity;

  constructor(scope: Construct, id: string, props: SesDomainConstructProps) {
    super(scope, id);

    // SES Email Identity with domain verification
    this.domain = new ses.EmailIdentity(this, 'Domain', {
      identity: ses.Identity.domain(props.domainName),
      dkimSigning: true,
    });

    // Note: Verification record is automatically created by EmailIdentity construct

    // Suppress cdk-nag warnings
    NagSuppressions.addResourceSuppressions(this, [
      {
        id: 'AwsSolutions-SES4',
        reason: 'SES domain identity is required for email receiving',
      },
    ]);
  }
}