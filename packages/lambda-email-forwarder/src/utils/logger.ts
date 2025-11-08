export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, meta?: any): void {
    console.log(JSON.stringify({ level: 'info', context: this.context, message, ...meta }));
  }

  error(message: string, error?: any): void {
    console.error(JSON.stringify({ level: 'error', context: this.context, message, error: error?.message, stack: error?.stack }));
  }
}
