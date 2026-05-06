import { type DependencyList, useEffect } from 'react';
import { useAsyncAction } from './use-async-action';

export function useAsync<T>(
  action: () => Promise<T>,
  dependencies: DependencyList,
  cleanup?: () => void,
) {
  const { data, loading, error, trigger } = useAsyncAction(action, { loading: true }, cleanup);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => trigger(), dependencies);
  return { data, loading, error };
}
