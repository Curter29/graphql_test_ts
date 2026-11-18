import winston from 'winston';
import { parse } from 'graphql';
import { useLogger } from '../../src/envelop/useLogger';
import { Logger } from '../../src/logger';
import { ContextType } from '../../src/types';

describe('useLogger with Logger unit', () => {
  const onParse = useLogger().onParse!;
  let createLogger: jest.SpyInstance;

  beforeEach(() => {
    createLogger = jest.spyOn(winston, 'createLogger').mockImplementation(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as winston.Logger));
  });

  afterEach(() => jest.restoreAllMocks());

  const buildLogger = (requestId: string, client: string): Logger => {
    const extendContext = jest.fn();
    onParse({
      context: { requestId, client } as ContextType,
      extendContext,
      params: { source: '{ __typename }' },
      parseFn: parse,
      setParseFn: jest.fn(),
      setParsedDocument: jest.fn(),
    });
    expect(extendContext).toHaveBeenCalledTimes(1);
    return extendContext.mock.calls[0][0].logger;
  };

  test('adds a Logger configured with requestId and client to context', () => {
    const logger = buildLogger('request-123', 'strata');

    expect(logger).toBeInstanceOf(Logger);
    expect(logger.requestId).toBe('request-123');
    expect(logger.client).toBe('strata');
  });

  test.each(['info', 'error', 'warn'] as const)(
    '%s includes requestId and client in every entry, with and without explain', method => {
      const logger = buildLogger('request-123', 'strata');
      const output = createLogger.mock.results[0].value;

      logger[method]('first message', 'details');
      logger[method]('second message');

      expect(output[method]).toHaveBeenCalledTimes(2);
      expect(output[method]).toHaveBeenNthCalledWith(1, 'first message', {
        explain: 'details',
        request_id: 'request-123',
        client: 'strata',
      });
      expect(output[method]).toHaveBeenNthCalledWith(2, 'second message', {
        explain: undefined,
        request_id: 'request-123',
        client: 'strata',
      });
    },
  );

  test('keeps requestId and client separate between request loggers', () => {
    const first = buildLogger('request-1', 'first-client');
    const second = buildLogger('request-2', 'second-client');

    first.info('first request');
    second.info('second request');

    expect(first).not.toBe(second);
    expect(createLogger.mock.results[0].value.info).toHaveBeenCalledWith('first request', {
      explain: undefined,
      request_id: 'request-1',
      client: 'first-client',
    });
    expect(createLogger.mock.results[1].value.info).toHaveBeenCalledWith('second request', {
      explain: undefined,
      request_id: 'request-2',
      client: 'second-client',
    });
  });
});
