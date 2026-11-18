import { addressStore } from '../../src/schema/address/store';
import { yoga } from '../exectuor';

const address = { street: '123 Street', city: 'Town', zipcode: '12345', state: 'NC' };
const query = '{ address(username: "jack") { state } }';
const mutation = `mutation CreateAddress {
  createAddress(username: "new-user", address: {
    street: "123 Street", city: "Town", zipcode: "12345", state: "NC"
  }) { state }
}`;
const operations = `query GetAddress ${query}\n${mutation}`;

const request = (query: string, client?: string, operationName?: string) => yoga.fetch(
  'http://localhost/graphql',
  {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(client === undefined ? {} : { client }),
    },
    body: JSON.stringify({ query, operationName }),
  },
);

describe('client header', () => {
  afterEach(() => jest.restoreAllMocks());

  test.each([undefined, '', '   '])('rejects a missing or empty header: %j', async client => {
    const get = jest.spyOn(addressStore, 'get');
    const response = await request(query, client);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      errors: [{ message: 'Missing required client header', extensions: { code: 'BAD_REQUEST' } }],
    });
    expect(get).not.toHaveBeenCalled();
  });

  test('rejects a mutation without the header before writing', async () => {
    const create = jest.spyOn(addressStore, 'create').mockResolvedValue(address);
    const response = await request(mutation);
    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  test('requires the header for GET requests', async () => {
    const url = `http://localhost/graphql?query=${encodeURIComponent(query)}`;
    const rejected = await yoga.fetch(url);
    expect(rejected.status).toBe(400);
    const allowed = await yoga.fetch(url, { headers: { client: 'strata' } });
    expect(await allowed.json()).toEqual({ data: { address: { state: 'NC' } } });
  });

  test.each(['strata', 'other'])('allows queries for %s', async client => {
    const response = await request(query, client);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { address: { state: 'NC' } } });
  });

  test('rejects strata mutations before calling the resolver', async () => {
    const create = jest.spyOn(addressStore, 'create').mockResolvedValue(address);
    const response = await request(mutation, 'strata');
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      errors: [{
        message: 'Client "strata" may only execute queries',
        extensions: { code: 'FORBIDDEN' },
      }],
    });
    expect(create).not.toHaveBeenCalled();
  });

  test('allows mutations for another client', async () => {
    const create = jest.spyOn(addressStore, 'create').mockResolvedValue(address);
    const response = await request(mutation, 'other');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { createAddress: { state: 'NC' } } });
    expect(create).toHaveBeenCalledWith('new-user', address);
  });

  test('checks the selected operation in a document with a query and mutation', async () => {
    const create = jest.spyOn(addressStore, 'create').mockResolvedValue(address);
    const allowed = await request(operations, 'strata', 'GetAddress');
    expect(await allowed.json()).toEqual({ data: { address: { state: 'NC' } } });
    const rejected = await request(operations, 'strata', 'CreateAddress');
    expect(rejected.status).toBe(403);
    expect(create).not.toHaveBeenCalled();
  });

  test('checks every request even when the document is cached', async () => {
    const create = jest.spyOn(addressStore, 'create').mockResolvedValue(address);
    expect((await request(mutation, 'other')).status).toBe(200);
    expect((await request(mutation, 'strata')).status).toBe(403);
    expect((await request(mutation)).status).toBe(400);
    expect(create).toHaveBeenCalledTimes(1);
  });
});
