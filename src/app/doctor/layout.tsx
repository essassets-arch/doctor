'use client';
import DoctorLayout from '@/components/DoctorLayout';

export default function DoctorRootLayout({ children }: { children: React.ReactNode }) {
  return <DoctorLayout>{children}</DoctorLayout>;
}
