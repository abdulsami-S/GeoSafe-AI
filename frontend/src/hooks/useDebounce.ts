import { useState, useEffect } from "react";

/**
 * useDebounce — delays updating the returned value until the input
 * has stopped changing for `delay` milliseconds.
 *
 * WHY THIS MATTERS:
 * Without debounce, every single keystroke in the lat/lon input
 * fields triggers a React state update AND can accidentally fire
 * an API call if the user submits mid-type. With a 400 ms debounce
 * on the coordinate values, we wait until the user has paused
 * before treating the value as "settled".
 *
 * @param value  The raw value to debounce (e.g. the input string)
 * @param delay  Milliseconds to wait after the last change (default 400)
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    // Clean up: if `value` changes before `delay` ms elapse,
    // cancel the pending timer so it never fires.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
