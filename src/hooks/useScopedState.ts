import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

/** Local state belongs to one account, filter or navigation context at a time. */
export default function useScopedState<T>(scope: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState({ scope, value: initialValue, revision: 0 });
  const revision = state.scope === scope ? state.revision : state.revision + 1;
  // Adjust during render so children never receive the previous context's value.
  if (state.scope !== scope) setState({ scope, value: initialValue, revision });
  const setValue = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    setState((current) => {
      // Ignore an async completion captured by a previous context.
      if (current.scope !== scope || current.revision !== revision) return current;
      const value = typeof next === "function"
        ? (next as (previous: T) => T)(current.value) : next;
      return Object.is(value, current.value) ? current : { scope, value, revision };
    });
  }, [scope, revision]);
  return [state.scope === scope ? state.value : initialValue, setValue];
}
