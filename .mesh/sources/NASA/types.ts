// @ts-nocheck

import type { InContextSdkMethod } from '@graphql-mesh/types';

export namespace NasaTypes {
  export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  /** The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text. */
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  /** The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. */
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
  ObjMap: { input: unknown; output: unknown; }
};

export type Query = {
  neoFeed?: Maybe<NeoFeedResponse>;
};


export type QueryneoFeedArgs = {
  startDate: Scalars['String']['input'];
  endDate: Scalars['String']['input'];
};

export type NeoFeedResponse = {
  element_count?: Maybe<Scalars['Int']['output']>;
  near_earth_objects?: Maybe<Scalars['JSON']['output']>;
};

export type HTTPMethod =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'TRACE'
  | 'PATCH';

  export type QuerySdk = {
      
  neoFeed: InContextSdkMethod<Query['neoFeed'], QueryneoFeedArgs, BaseMeshContext>
  };

  export type MutationSdk = {
    
  };

  export type SubscriptionSdk = {
    
  };

  export type Context = {
      ["NASA"]: { Query: QuerySdk, Mutation: MutationSdk, Subscription: SubscriptionSdk },
      
    };
}
