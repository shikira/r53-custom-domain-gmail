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

    // Add verification record to Route53
    new route53.TxtRecord(this, 'VerificationRecord', {
      zone: props.hostedZone,
      recordName: `_amazonses.${props.domainName}`,
      values: [this.domain.dkimDnsTokenValue1!],
      ttl: cdk.Duration.minutes(5),
    });

    // Suppress cdk-nag warnings
    NagSuppressions.addResourceSuppressions(this, [
      {
        id: 'AwsSolutions-SES4',
        reason: 'SES domain identity is required for email receiving',
      },
    ]);
  }
}