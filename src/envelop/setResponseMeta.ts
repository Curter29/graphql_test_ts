import { Plugin } from '@envelop/core';
import { ContextType } from '../types';

export const setResponseMeta = (): Plugin<ContextType> => ({
  onExecute() {
    return {
      onExecuteDone({ args, result, setResult }) {
        const response = {
          ...result,
          metadata: { requestId: args.contextValue.requestId },
        };
        setResult(response);
      },
    };
  },
});
