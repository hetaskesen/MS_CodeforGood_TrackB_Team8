import { useEffect, useRef } from "react";

/**
 * Like useEffect but guaranteed to run the callback only once,
 * surviving React StrictMode double-invocation and component remounts.
 * The guard lives at module scope so it persists across instances.
 *
 * Usage:
 *   const usePantryFetchOnce = createOnceEffect();
 *   // inside component:
 *   usePantryFetchOnce(() => { fetch(...) });
 */
export function createOnceEffect() {
  let hasRun = false;
  return function useOnceEffect(callback, deps = []) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;
    useEffect(() => {
      if (hasRun) return;
      hasRun = true;
      callbackRef.current();
    }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  };
}
