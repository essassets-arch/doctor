'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DoctorRootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/doctor/dashboard');
  }, [router]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #036d92', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#64748B', fontSize: 13, fontWeight: 600 }}>Loading Doctor Clinical OS...</p>
      </div>
    </div>
  );
}
