'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LottieLoader from '@/components/LottieLoader';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'staff') {
      router.replace('/business-dashboard');
      return;
    }

    router.replace('/command-center');
  }, [router, user?.role]);

  return (
    <div className="flex items-center justify-center h-64">
      <LottieLoader label="Redirecting to Command Center..." />
    </div>
  );
}
