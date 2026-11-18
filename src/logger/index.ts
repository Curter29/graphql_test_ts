import winston from 'winston';

export class Logger {
  private winston: winston.Logger;

  requestId = '';
  client: string | null = null;

  constructor() {
    this.winston = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [new winston.transports.Console()],
    });
  }

  setRequestId(requestId: string) {
    this.requestId = requestId;
  }

  setClient(client: string | null) {
    this.client = client;
  }

  headers() {
    return {
      request_id: this.requestId,
      client: this.client,
    };
  }

  info(message: string, explain?: string) {
    this.winston.info(message, { ...{ explain: explain }, ...this.headers() });
  }

  error(message: string, explain?: string) {
    this.winston.error(message, { ...{ explain: explain }, ...this.headers() });
  }

  warn(message: string, explain?: string) {
    this.winston.warn(message, { ...{ explain: explain }, ...this.headers() });
  }
}
