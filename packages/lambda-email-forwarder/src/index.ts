import type { SESEvent, Context } from 'aws-lambda';

export const handler = async (event: SESEvent, context: Context): Promise<void> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));
};
