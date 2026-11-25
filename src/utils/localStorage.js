import { useCallback, useEffect, useMemo, useState } from 'react';

// Every write notifies the whole app (and other browser tabs), so screens never show stale data.
const CHANGE_EVENT = 'royal-north-india:change';

// Safe storage: falls back to memory if the browser blocks Local Storage (e.g. embedded previews)
const mem = {};
const KEY_PREFIX = 'royalNorthIndia:';
const storageKey = (key) => `${KEY_PREFIX}${key}`;
const store = {
  get: (k) => { try { return window.localStorage.getItem(storageKey(k)); } catch { return mem[k] ?? null; } },
  set: (k, v) => { try { window.localStorage.setItem(storageKey(k), v); } catch { mem[k] = v; } },
  del: (k) => { try { window.localStorage.removeItem(storageKey(k)); } catch { delete mem[k]; } },
};

const notify = (key) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
};

export const has = (key) => store.get(key) !== null;
export const remove = (key) => { store.del(key); notify(key); };
export const read = (key, fallback) => {
  try {
    const v = store.get(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
export const write = (key, value) => { store.set(key, JSON.stringify(value)); notify(key); };
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

// Local calendar date as YYYY-MM-DD (toISOString would give yesterday's date for IST before 05:30)
const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => ymd();

// Date-only strings are read as local dates so they never shift by a day
const parseDay = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00`) : new Date(d));
export const fmtDate = (d) =>
  d ? parseDay(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const fmtTime = (d) =>
  new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

// Subscribes a component to every change in storage and returns a counter that changes on each one
export function useStoreVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(CHANGE_EVENT, bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener(CHANGE_EVENT, bump);
      window.removeEventListener('storage', bump);
    };
  }, []);
  return version;
}

// Local Storage is the single source of truth: data is read from it on every change, never copied into stale state
export function useLS(key, fallback = []) {
  const version = useStoreVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => read(key, fallback), [key, version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const set = useCallback((v) => {
    const next = typeof v === 'function' ? v(read(key, fallback)) : v;
    write(key, next);
  }, [key]);
  return [data, set];
}
