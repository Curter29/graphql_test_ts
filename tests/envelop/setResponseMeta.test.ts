import { buildSchema, ExecutionResult, GraphQLError, parse } from 'graphql';
import { setResponseMeta } from '../../src/envelop/setResponseMeta';
import { ContextType } from '../../src/types';

const schema = buildSchema('type Query { state: String }');
const document = parse('{ state }');

const applyMetadata = async (result: ExecutionResult, requestId: string) => {
  const onExecute = setResponseMeta().onExecute!;
  const args = { schema, document, contextValue: { requestId } as ContextType };
  const hooks = await onExecute({ args } as Parameters<typeof onExecute>[0]);
  if (!hooks || !hooks.onExecuteDone) {
    throw new Error('Expected onExecuteDone hook');
  }

  const setResult = jest.fn();
  await hooks.onExecuteDone({
    args,
    result,
    setResult,
  });
  return setResult;
};

describe('setResponseMeta unit', () => {
  test('preserves data and adds the requestId from context', async () => {
    const result = { data: { address: { state: 'NC' } } };
    const setResult = await applyMetadata(result, 'request-123');

    expect(setResult).toHaveBeenCalledTimes(1);
    expect(setResult).toHaveBeenCalledWith({
      data: { address: { state: 'NC' } },
      metadata: { requestId: 'request-123' },
    });
  });

  test('preserves resolver errors and adds the requestId from context', async () => {
    const errors = [new GraphQLError('No address found in getAddress resolver')];
    const setResult = await applyMetadata({ data: { address: null }, errors }, 'request-456');

    expect(setResult).toHaveBeenCalledTimes(1);
    expect(setResult).toHaveBeenCalledWith({
      data: { address: null },
      errors,
      metadata: { requestId: 'request-456' },
    });
  });
});
