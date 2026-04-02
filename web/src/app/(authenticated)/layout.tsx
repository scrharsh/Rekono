'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/Layout';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasActiveSubscription } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!hasActiveSubscription) {
      router.replace('/subscribe');
    }
  }, [hasActiveSubscription, isAuthenticated, router]);

  if (!isAuthenticated || !hasActiveSubscription) return null;

  return <AppLayout>{children}</AppLayout>;
}
