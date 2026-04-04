'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/Layout';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasActiveSubscription, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!hasActiveSubscription) {
      router.replace('/subscribe');
    }
  }, [hasActiveSubscription, isAuthenticated, isReady, router]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface)]">
        <div className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>Loading workspace...</div>
      </div>
    );
  }

  if (!isAuthenticated || !hasActiveSubscription) return null;

  return <AppLayout>{children}</AppLayout>;
}
