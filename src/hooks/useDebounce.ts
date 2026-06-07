/**
 * useDebounce Hook
 * Debounces a value with a delay
 * Useful for search inputs to avoid excessive re-renders
 */

import { useState, useEffect } from 'react';

export const useDebounce = <T,>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
