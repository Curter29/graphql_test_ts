import { getAddress, createAddress } from "./address/resolvers";
import { GetAddressInput, CreateAddressInput, Address } from "./address/types";

export const resolvers = {
  Query: {
    address: (parent: any, args: GetAddressInput, context: any, info: any): Promise<Address> => {
      return getAddress(parent, args, context);
    },
  },
  Mutation: {
    createAddress: (parent: any, args: CreateAddressInput, context: any): Promise<Address> => {
      return createAddress(parent, args, context);
    },
  },
};
