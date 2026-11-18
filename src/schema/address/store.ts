import { Config, JsonDB } from 'node-json-db';
import { GraphQLError } from 'graphql';
import path from 'node:path';
import { Address, AddressInput, Addresses } from './types';

export class AddressStore {
  private readonly db: JsonDB;

  constructor(filename: string) {
    this.db = new JsonDB(new Config(filename, true, true, '/'));
  }

  async get(username: string): Promise<Address | null> {
    const addresses = await this.db.getObject<Addresses>('/');
    return Object.prototype.hasOwnProperty.call(addresses, username)
      ? addresses[username]
      : null;
  }

  async create(username: string, address: AddressInput): Promise<Address> {
    if (await this.get(username)) {
      throw new GraphQLError('Address already exists for this username', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    await this.db.push('/', { [username]: address }, false);
    return (await this.get(username))!;
  }
}

export const addressStore = new AddressStore(
  path.join(__dirname, '../../../data/addresses.json'),
);
