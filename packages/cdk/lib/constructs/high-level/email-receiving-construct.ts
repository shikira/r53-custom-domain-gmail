import { Construct } from 'constructs';
import { S3BucketConstruct } from '../low-level/s3-bucket-construct';

export interface EmailReceivingConstructProps {
  readonly domainName: string;
}

export class EmailReceivingConstruct extends Construct {
  public readonly bucket: S3BucketConstruct;

  constructor(scope: Construct, id: string, props: EmailReceivingConstructProps) {
    super(scope, id);

    this.bucket = new S3BucketConstruct(this, 'Bucket', {
      domainName: props.domainName,
    });
  }
}
