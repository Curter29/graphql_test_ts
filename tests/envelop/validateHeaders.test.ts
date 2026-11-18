import { parse } from 'graphql';
import { validateHeaders } from '../../src/envelop/validateHeaders';

const onRequestParse = validateHeaders().onRequestParse!;
const onExecute = validateHeaders().onExecute!;

const checkHeader = (client?: string) => {
  const request = new Request('http://localhost/graphql', {
    headers: client === undefined ? {} : { client },
  });
  return onRequestParse({ request } as Parameters<typeof onRequestParse>[0]);
};

const checkOperation = (client: string, query: string, operationName?: string) => {
  const request = new Request('http://localhost/graphql', { headers: { client } });
  return onExecute({
    args: {
      document: parse(query),
      operationName,
      contextValue: { request },
    },
  } as Parameters<typeof onExecute>[0]);
};

describe('validateHeaders unit', () => {
  test.each([undefined, '', '   '])('rejects a missing or empty client: %j', client => {
    expect(() => checkHeader(client)).toThrow(expect.objectContaining({
      name: 'GraphQLError',
      message: 'Missing required client header',
      extensions: { code: 'BAD_REQUEST', http: { status: 400 } },
    }));
  });

  test.each(['strata', 'other'])('accepts a non-empty client: %s', client => {
    expect(() => checkHeader(client)).not.toThrow();
  });

  test.each(['strata', 'other'])('allows a query for %s', client => {
    expect(() => checkOperation(client, '{ address(username: "jack") { state } }'))
      .not.toThrow();
  });

  test('rejects a mutation for strata', () => {
    expect(() => checkOperation('strata', 'mutation { createAddress { state } }'))
      .toThrow(expect.objectContaining({
        name: 'GraphQLError',
        message: 'Client "strata" may only execute queries',
        extensions: { code: 'FORBIDDEN', http: { status: 403 } },
      }));
  });

  test('allows a mutation for another client', () => {
    expect(() => checkOperation('other', 'mutation { createAddress { state } }'))
      .not.toThrow();
  });

  const document = `
    query ReadAddress { address(username: "jack") { state } }
    mutation CreateAddress { createAddress { state } }
  `;

  test('allows the selected query when the document also contains a mutation', () => {
    expect(() => checkOperation('strata', document, 'ReadAddress')).not.toThrow();
  });

  test('rejects the selected mutation when the document also contains a query', () => {
    expect(() => checkOperation('strata', document, 'CreateAddress'))
      .toThrow('Client "strata" may only execute queries');
  });
});
