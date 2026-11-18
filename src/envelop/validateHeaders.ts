import { Plugin } from 'graphql-yoga';
import { getOperationAST, GraphQLError, OperationTypeNode } from 'graphql';
import { ContextType } from '../types';

export const validateHeaders = (): Plugin<ContextType> => ({
  onRequestParse({ request }) {
    if (!request.headers.get('client')?.trim()) {
      throw new GraphQLError('Missing required client header', {
        extensions: { code: 'BAD_REQUEST', http: { status: 400 } },
      });
    }
  },
  onExecute({ args }) {
    const operation = getOperationAST(args.document, args.operationName);
    if (
      args.contextValue.request.headers.get('client') === 'strata'
      && operation
      && operation.operation !== OperationTypeNode.QUERY
    ) {
      throw new GraphQLError('Client "strata" may only execute queries', {
        extensions: { code: 'FORBIDDEN', http: { status: 403 } },
      });
    }
  },
});
