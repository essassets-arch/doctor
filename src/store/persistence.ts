import type { persist as ZustandPersist } from 'zustand/middleware';

export const DATABASE_KEY = 'medflow-browser-state-v1';
type Database = { version: 1; slices: Record<string, { state: any; version?: number }> };
let transaction: { db: Database; rollback: Map<string, () => void> } | null = null;
let failure: string | null = null;
export const persistenceError = () => failure;
const stores = new Map<string, () => void>();

function read(): Database {
  if (transaction) return transaction.db;
  const raw = localStorage.getItem(DATABASE_KEY);
  if (!raw) return { version: 1, slices: {} };
  const data = JSON.parse(raw);
  if (data.version !== 1 || !data.slices || typeof data.slices !== 'object' || Array.isArray(data.slices)) {
    throw new Error('Browser records cannot be read. Restore a valid backup; existing storage has been preserved.');
  }
  return data;
}

// Every persisted Zustand slice shares this envelope. Legacy keys are imported
// once and retained as recovery copies, never used after the slice is imported.
export const browserStorage = {
  getItem(name: string) {
    if (typeof window === 'undefined') return null;
    const db = read();
    if (db.slices[name]) return db.slices[name];
    const legacy = localStorage.getItem(name);
    if (!legacy) return null;
    const value = JSON.parse(legacy);
    if (!value.state || typeof value.state !== 'object') throw new Error(`Invalid stored records: ${name}`);
    db.slices[name] = value;
    localStorage.setItem(DATABASE_KEY, JSON.stringify(db));
    return value;
  },
  setItem(name: string, value: Database['slices'][string]) {
    if (typeof window === 'undefined') return;
    try {
      const db = read();
      db.slices[name] = value;
      if (!transaction) localStorage.setItem(DATABASE_KEY, JSON.stringify(db));
      failure = null;
    } catch (error) {
      failure = `Records were not saved: ${error instanceof Error ? error.message : 'Browser storage unavailable'}`;
      window.dispatchEvent(new Event('medflow-storage-error'));
      throw new Error(failure);
    }
  },
  removeItem() { throw new Error('Clinical records cannot be cleared through the application.'); },
};

// Persist before publishing a mutation. A failed write leaves runtime state
// unchanged, so callers cannot accidentally report an uncommitted save.
// The public middleware signature remains compatible with Zustand persist.
export const persist: typeof ZustandPersist = ((creator: any, options: any) => (set: any, get: any, api: any) => {
  const listeners = new Set<(state: any) => void>();
  let hydrated = false;
  let initial: any;
  const write = (patch: any, replace?: boolean) => {
    if (typeof window !== 'undefined' && !hydrated) throw new Error('Wait for browser records to finish loading.');
    const update = typeof patch === 'function' ? patch(get()) : patch;
    const next = replace ? update : { ...get(), ...update };
    if (transaction && !transaction.rollback.has(options.name)) {
      const previous = get();
      transaction.rollback.set(options.name, () => set(previous, true));
    }
    browserStorage.setItem(options.name, { state: options.partialize ? options.partialize(next) : next, version: options.version || 0 });
    set(next, true);
  };
  api.setState = write;
  const hydrate = () => {
    try {
      const saved = browserStorage.getItem(options.name);
      if (saved) {
        const base = get() || initial;
        const allowed = Object.fromEntries(Object.entries(saved.state).filter(([key]) => key in base && typeof base[key] !== 'function'));
        set({ ...base, ...allowed }, true);
      }
      hydrated = true;
      options.onRehydrateStorage?.()(get());
      listeners.forEach(fn => fn(get()));
    } catch (error) {
      failure = error instanceof Error ? error.message : 'Unable to restore browser records';
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('medflow-storage-error'));
    }
  };
  api.persist = { rehydrate: hydrate, hasHydrated: () => hydrated, onFinishHydration: (fn: any) => { listeners.add(fn); return () => listeners.delete(fn); }, getOptions: () => options, clearStorage: browserStorage.removeItem };
  initial = creator(write, get, api);
  if (typeof window !== 'undefined') queueMicrotask(hydrate);
  stores.set(options.name, hydrate);
  return initial;
}) as typeof ZustandPersist;

export function hydrateAll() { stores.forEach(hydrate => hydrate()); }
export function atomic<T>(action: () => T): T {
  if (transaction) return action();
  const db = read();
  transaction = { db, rollback: new Map() };
  try {
    const result = action();
    if (typeof window !== 'undefined') {
      const keys = ['doctor-billing', 'doctor-queue', 'doctor-patients', 'doctor-appointments', 'doctor-consultation', 'doctor-pharmacy', 'doctor-admin'];
      keys.forEach(k => {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            transaction!.db.slices[k] = JSON.parse(raw);
          }
        } catch {}
      });
    }
    localStorage.setItem(DATABASE_KEY, JSON.stringify(transaction.db));
    return result;
  } catch (error) {
    transaction.rollback.forEach(undo => undo());
    throw error;
  } finally { transaction = null; }
}
if (typeof window !== 'undefined') window.addEventListener('storage', event => {
  if (event.key === DATABASE_KEY) hydrateAll();
});
