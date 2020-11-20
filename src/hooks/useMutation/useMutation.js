import identity from 'lodash/identity';
import { useCallback, useState } from 'react';
import { useDefaults, useGraphQLClient } from '..';

export default function useMutation(tag, ...args) {
  const params = useDefaults(args[0], {
    minProgress: 2000,
    autoReset: undefined,
    refetchQueries: [],
  });
  const client = useGraphQLClient();
  const [state, setState] = useState();
  const [error, setError] = useState();

  const resetState = useCallback(() => {
    setState(undefined);
    setError(undefined);
  }, []);

  const request = useCallback(async (input) => {
    const { minProgress, refetchQueries } = params;
    const [result] = await Promise.all([
      client.mutate(tag, input).catch(identity),
      new Promise((r) => setTimeout(r, minProgress)),
    ]);
    if (result instanceof Error) throw result;
    refetchQueries.forEach(({ query, variables }) => client.query(query, variables, params));
    return result;
  }, [client, tag, params]);

  const mutate = useCallback(async (input) => {
    const { autoReset } = params;
    setState('processing');
    try {
      const result = await request(input);
      setState('finish');
      return result;
    } catch (err) {
      setState('failed');
      setError(err);
    } finally {
      if (autoReset !== undefined) setTimeout(resetState, autoReset);
    }
    return null;
  }, [request, params, error, state, resetState]);

  return [mutate, { error, state, resetState }];
}
