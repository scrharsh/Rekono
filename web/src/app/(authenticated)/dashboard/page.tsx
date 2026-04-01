'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 animate-spin" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span style={{ color: 'var(--on-surface-variant)' }}>Redirecting to Command Center...</span>
      </div>
    </div>
  );
}
