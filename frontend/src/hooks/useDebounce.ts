import { useState, useEffect } from "react";

/**
 * useDebounce — delays propagating a value until the input has stopped
 * changing for `delay` milliseconds.
 *
 * WHY THIS MATTERS (Frontend PERF 1):
 * Without debounce, every keystroke in the lat/lon fields triggers a React
 * state update and — if the map is open — causes an immediate flyTo() call
 * and a potential re-render cascade.  A 400 ms debounce waits until the user
 * has paused before treating the value as "settled", so the map only
 * re-centers once per completed coordinate entry rather than mid-type.
 *
 * The same hook also guards the AbortController in analyzeLand(): even if
 * users type fast, the debounced value ensures we never fire a fetch with a
 * half-entered coordinate.
 *
 * @param value   The raw value to debounce (e.g. the input string)
 * @param delay   Milliseconds to wait after the last change (default 400 ms)
 *
 * @example
 *   const debouncedLat = useDebounce(lat, 400);
 *   // debouncedLat only updates 400 ms after `lat` stops changing
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Schedule the update
    const timer = setTimeout(() => setDebouncedValue(value), delay);

    // If `value` changes before `delay` ms elapse, cancel the pending timer
    // so it never fires — the new value will schedule its own timer.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
