import { buildHeaders } from '../../src/envelop/buildHeaders';

describe('buildHeaders unit', () => {
  const onEnveloped = buildHeaders().onEnveloped!;

  const buildContext = (client: string) => {
    const request = new Request('http://localhost/graphql', { headers: { client } });
    const extendContext = jest.fn();
    onEnveloped({
      context: { request } as NonNullable<Parameters<typeof onEnveloped>[0]['context']>,
      extendContext,
      setSchema: jest.fn(),
    });
    return extendContext;
  };

  test.each(['strata', 'other'])('adds a requestId and the client header: %s', client => {
    const extendContext = buildContext(client);

    expect(extendContext).toHaveBeenCalledTimes(1);
    expect(extendContext).toHaveBeenCalledWith({
      requestId: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
      client,
    });
  });

  test('creates a different requestId for each request', () => {
    const first = buildContext('first').mock.calls[0][0];
    const second = buildContext('second').mock.calls[0][0];

    expect(first.requestId).not.toBe(second.requestId);
    expect(first.client).toBe('first');
    expect(second.client).toBe('second');
  });
});
