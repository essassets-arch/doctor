'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      flexDirection: 'column',
      gap: 12,
      color: '#475569',
      fontFamily: 'inherit'
    }}>
      <div style={{
        width: 36,
        height: 36,
        border: '3px solid #C7D2FE',
        borderTopColor: '#4338ca',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading MedFlow Enterprise Admin Console...</span>
    </div>
  );
}
