import { GetAddressInput, CreateAddressInput, Address } from './types';
import { GraphQLError } from 'graphql';
import { addressStore } from './store';

export const getAddress = async (_: any, args: GetAddressInput, context: any): Promise<Address> => {
  context.logger.info('getAddress', 'Enter resolver');
  const address = await addressStore.get(args.username);
  if (address) {
    context.logger.info('getAddress', 'Returning address');
    return address;
  }
  context.logger.error('getAddress', 'No address found');
  throw new GraphQLError('No address found in getAddress resolver', { extensions: { code: 'NOT_FOUND' } });
};

export const createAddress = async (_: any, args: CreateAddressInput, context: any): Promise<Address> => {
  if (!args.username.trim()) {
    throw new GraphQLError('Invalid username', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const address = args.address;
  if (Object.values(address).every(value => !value.trim())) {
    throw new GraphQLError('Provide at least one non-empty address field', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  context.logger.info('createAddress');
  return addressStore.create(args.username, address);
};
