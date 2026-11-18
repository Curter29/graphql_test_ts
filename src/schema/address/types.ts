export type Address = {
  street: string | null;
  city: string | null;
  zipcode: string | null;
  state: string | null;
}

export type Addresses = {
  [username: string]: Address;
};

export type GetAddressInput = {
  username: string;
}

export type AddressInput = {
  street: string;
  city: string;
  zipcode: string;
  state: string;
};

export type CreateAddressInput = {
  username: string;
  address: AddressInput;
};
