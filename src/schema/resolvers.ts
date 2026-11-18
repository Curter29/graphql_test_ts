import { getAddress, createAddress } from './address/resolvers';
import { nearEarthObjects } from './nasa/resolvers';
import { GetAddressInput, CreateAddressInput, Address } from './address/types';
import { ContextType } from '../types';

export const resolvers = {
  Query: {
    address: (
      parent: unknown,
      args: GetAddressInput,
      context: ContextType,
    ): Promise<Address> => {
      return getAddress(parent, args, context);
    },
    nearEarthObjects,
  },
  Mutation: {
    createAddress: (
      parent: unknown,
      args: CreateAddressInput,
      context: ContextType,
    ): Promise<Address> => {
      return createAddress(parent, args, context);
    },
  },
};
