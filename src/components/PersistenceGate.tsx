'use client';
import { useEffect, useState, type ReactNode } from 'react';
import '@/store';
import { hydrateAll, persistenceError } from '@/store/persistence';

export default function PersistenceGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const check = () => setError(persistenceError());
    window.addEventListener('medflow-storage-error', check);
    hydrateAll(); check(); setReady(true);
    return () => window.removeEventListener('medflow-storage-error', check);
  }, []);
  if (error) return <main className="page-container" role="alert"><h1>Browser storage needs attention</h1><p>{error}</p><p>Existing records have been preserved. Free browser storage or restore access, then reload.</p><button onClick={() => location.reload()}>Retry loading records</button></main>;
  if (!ready) return <main className="page-container" role="status">Restoring patient records…</main>;
  return children;
}
