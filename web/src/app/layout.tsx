import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Rekono — Intelligent CA Workspace & Business Reconciliation OS',
  description: 'Rekono is an intelligent operating system for Chartered Accountants — manage clients, services, payments, documents, and deadlines with smart prioritization and actionable guidance.',
  keywords: 'CA OS, chartered accountant, client management, GST, reconciliation, business intelligence',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
