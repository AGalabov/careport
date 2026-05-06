import { useState, useCallback, useRef, useEffect } from 'react';

type AsyncState<Result> = {
  loading: boolean;
  error?: unknown;
  data?: Result;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useAsyncAction<Args extends any[], Result>(
  action: (...args: Args) => Promise<Result>,
  initialState: AsyncState<Result> = { loading: false },
  cleanup?: () => void,
) {
  const [state, setState] = useState(initialState);

  const actionRef = useRef(action);
  actionRef.current = action; // eslint-disable-line react-hooks/refs

  const cleanupRef = useRef(cleanup);
  cleanupRef.current = cleanup; // eslint-disable-line react-hooks/refs

  const requestIdRef = useRef(0);

  const perform = useCallback(async (...args: Args) => {
    setState((state) => ({ ...state, loading: true }));
    requestIdRef.current += 1;
    const myRequestId = requestIdRef.current;

    try {
      const result = await actionRef.current(...args);

      if (myRequestId === requestIdRef.current) {
        setState({ data: result, error: undefined, loading: false });
      }

      return result;
    } catch (err) {
      if (myRequestId === requestIdRef.current) {
        setState({ data: undefined, error: err, loading: false });
      }

      throw err;
    }
  }, []);

  const trigger = useCallback(
    (...args: Args) => {
      perform(...args).catch(() => {
        // Intentionally do nothing
      });
    },
    [perform],
  );

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      cleanupRef.current?.();
    };
  }, []);

  return { ...state, perform, trigger };
}
