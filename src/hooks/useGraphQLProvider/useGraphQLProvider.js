import once from 'lodash/once';
import {
  useCallback, useState, useRef, useMemo,
} from 'react';
import identity from 'lodash/identity';
import useDefaults from '../useDefaults';
import createClient from './createClient';
import isBrowser from '../../utils/isBrowser';

export default function useGraphQLProvider(options) {
  const [user, setUser] = useState(null);
  const initialize = useRef({});
  if (initialize.current.promise === undefined) {
    initialize.current.promise = new Promise((resolve) => {
      initialize.current.resolve = once(resolve);
    });
  }

  const userHander = useCallback((value) => {
    setUser(value);
    initialize.current.promise = null;
    initialize.current.resolve();
  }, []);

  const configs = useDefaults(options, {
    graphql: '/graphql',
    authorization: '/authorization',
    certificate: '/certificate',
    errorHander: identity,
    userHander,
  });

  const client = useMemo(() => {
    console.log({configs})
    if (isBrowser === false) return {};
    return createClient(configs);
  }, [configs]);

  const { promise: suspense } = initialize.current;
  return [client, { user, suspense }];
}
