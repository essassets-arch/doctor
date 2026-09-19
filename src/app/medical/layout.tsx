import MedicalLayout from '@/components/MedicalLayout';

export default function MedicalRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MedicalLayout>{children}</MedicalLayout>;
}
