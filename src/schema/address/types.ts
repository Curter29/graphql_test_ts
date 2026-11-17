export type Address = {
  street: string;
  city: string;
  zipcode: string;
  state: string;
};

export type Addresses = {
  [key: string]: Address;
};

export type GetAddressInput = {
  username: string;
};

export type AddressInput = Address;

export type CreateAddressInput = GetAddressInput & {
  address: AddressInput;
};
