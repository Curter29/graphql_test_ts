import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parse } from 'graphql';
import { AddressStore, addressStore } from '../../src/schema/address/store';
import { executor } from '../exectuor';

const mutation = parse(`
  mutation CreateAddress($username: String!, $address: AddressInput!) {
    createAddress(username: $username, address: $address) {
      street
      city
      zipcode
      state
    }
  }
`);

const existingAddress = {
  street: '123 Street St.',
  city: 'Sometown',
  zipcode: '43215',
  state: 'NC',
};

describe('createAddress', () => {
  let directory: string;
  let filename: string;

  beforeEach(async () => {
    directory = await mkdtemp(path.join(os.tmpdir(), 'address-test-'));
    filename = path.join(directory, 'addresses.json');
    await writeFile(filename, JSON.stringify({ jack: existingAddress }));
    const store = new AddressStore(filename);
    jest.spyOn(addressStore, 'get').mockImplementation(store.get.bind(store));
    jest.spyOn(addressStore, 'create').mockImplementation(store.create.bind(store));
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await rm(directory, { recursive: true, force: true });
  });

  test('creates a full address, preserves other users and makes it queryable', async () => {
    const address = { street: '234 Other St', city: 'Townville', zipcode: '32145', state: 'SC' };
    const result = await executor({
      document: mutation,
      variables: { username: 'jill', address },
    });

    expect(result).toEqual({
      data: { createAddress: address },
    });
    expect(JSON.parse(await readFile(filename, 'utf8'))).toEqual({
      jack: existingAddress,
      jill: address,
    });
    expect(await new AddressStore(filename).get('jill')).toEqual(address);
    expect(await executor({
      document: parse('{ address(username: "jill") { city state } }'),
    })).toEqual({ data: { address: { city: 'Townville', state: 'SC' } } });
  });

  test('rejects an existing user without changing the file', async () => {
    const before = await readFile(filename, 'utf8');
    expect(await executor({
      document: mutation,
      variables: { username: 'jack', address: { ...existingAddress, state: 'SC' } },
    })).toMatchObject({
      data: { createAddress: null },
      errors: [{
        message: 'Address already exists for this username',
        extensions: { code: 'BAD_USER_INPUT' },
      }],
    });
    expect(await readFile(filename, 'utf8')).toBe(before);
  });

  test.each(['street', 'city', 'zipcode', 'state'] as const)(
    'rejects a missing or null required field: %s', async (field) => {
      const before = await readFile(filename, 'utf8');
      for (const value of [undefined, null]) {
        expect(await executor({
          document: mutation,
          variables: { username: 'jill', address: { ...existingAddress, [field]: value } },
        })).toMatchObject({ errors: expect.any(Array) });
      }
      expect(await readFile(filename, 'utf8')).toBe(before);
    },
  );

  test('rejects an empty input object', async () => {
    const before = await readFile(filename, 'utf8');
    expect(await executor({
      document: mutation,
      variables: { username: 'jill', address: {} },
    })).toMatchObject({ errors: expect.any(Array) });
    expect(await readFile(filename, 'utf8')).toBe(before);
  });

  test('rejects an address without non-empty fields', async () => {
      const before = await readFile(filename, 'utf8');
      expect(await executor({
        document: mutation,
        variables: { username: 'jack', address: { street: '', city: '  ', zipcode: '', state: '' } },
      })).toMatchObject({
        errors: [{
          message: 'Provide at least one non-empty address field',
          extensions: { code: 'BAD_USER_INPUT' },
        }],
      });
      expect(await readFile(filename, 'utf8')).toBe(before);
  });

  test.each(['', '  ', '__proto__', 'constructor', 'prototype'])(
    'rejects invalid username: %j', async (username) => {
      const before = await readFile(filename, 'utf8');
      expect(await executor({
        document: mutation,
        variables: { username, address: existingAddress },
      })).toMatchObject({ errors: [{ message: 'Invalid username' }] });
      expect(await readFile(filename, 'utf8')).toBe(before);
    },
  );

  test('treats path characters in a username as part of the key', async () => {
    await executor({
      document: mutation,
      variables: { username: 'team/jack[0]', address: { ...existingAddress, state: 'NY' } },
    });
    expect(JSON.parse(await readFile(filename, 'utf8'))).toEqual({
      jack: existingAddress,
      'team/jack[0]': { ...existingAddress, state: 'NY' },
    });
  });
});
