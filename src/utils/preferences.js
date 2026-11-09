import { useEffect, useState } from 'react';

export function usePreference(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(`hololab.${key}`);
      return saved === null ? fallback : JSON.parse(saved);
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try { window.localStorage.setItem(`hololab.${key}`, JSON.stringify(value)); }
    catch { /* Local storage can be unavailable in private browser contexts. */ }
  }, [key, value]);

  return [value, setValue];
}
