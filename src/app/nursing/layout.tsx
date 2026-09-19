import NursingLayout from '@/components/NursingLayout';

export default function NursingRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NursingLayout>{children}</NursingLayout>;
}
