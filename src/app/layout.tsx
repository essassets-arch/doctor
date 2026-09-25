import type { Metadata } from "next";
import "./globals.css";
import PersistenceGate from "@/components/PersistenceGate";

export const metadata: Metadata = {
  title: "MedFlow OPD — Receptionist Panel",
  description: "MedFlow Hospital Outpatient Department Management System — Receptionist & Front Desk Portal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body><PersistenceGate>{children}</PersistenceGate></body>
    </html>
  );
}
