'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SmartSummary } from '@/components/SmartSummary';
import Icon from '@/components/Icon';

export default function BusinessDashboardPage() {
  const { user } = useAuth();
  const showroomId = useMemo(() => user?.showroomIds?.[0] ?? '', [user?.showroomIds]);

  const quickActions = showroomId
    ? [
        { label: 'Open Showroom', href: `/showrooms/${showroomId}`, icon: 'M3 21h18M4.5 21V5.25L12 3l7.5 2.25V21M9 21v-8.25h6V21' },
        { label: 'Transactions', href: `/showrooms/${showroomId}/transactions`, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
        { label: 'Export Data', href: `/showrooms/${showroomId}/export`, icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
        { label: 'Review Queues', href: '/queues', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
      ]
    : [
        { label: 'Connect CA', href: '/connect', icon: 'M17 20h5v-2a3 3 0 00-4-2.83M9 20H4v-2a3 3 0 014-2.83m10-4.34a3 3 0 11-6 0 3 3 0 016 0zm-10 0a3 3 0 11-6 0 3 3 0 016 0z' },
        { label: 'View Reports', href: '/reports', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z' },
      ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">Business OS</p>
          <h1 className="page-title">Business Dashboard</h1>
          <p className="page-subtitle">Your business activity, queue, and reconciliation overview</p>
        </div>
        {showroomId ? <span className="badge-blue">Connected showroom</span> : <span className="badge-yellow">No showroom yet</span>}
      </div>

      {showroomId ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <SmartSummary showroomId={showroomId} />
          </div>
          <div className="lg:col-span-2 card card-body space-y-4">
            <div>
              <h2 className="card-title">Quick Actions</h2>
              <p className="text-xs text-[#4f71a5] mt-1">Continue where the business left off</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href} className="flex items-center gap-3 rounded-xl border border-[#dbe7ff] bg-[#f7fbff] px-4 py-3 hover:border-[#0b57d0] hover:bg-[#eef4ff] transition">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#dbe7ff] flex items-center justify-center text-[#0b57d0]">
                    <Icon d={action.icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#153c74]">{action.label}</p>
                    <p className="text-xs text-[#4f71a5]">Open the next workspace</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="rounded-2xl bg-[#f7fbff] border border-[#dbe7ff] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0b57d0]">Next Step</p>
              <p className="mt-2 text-sm text-[#4f71a5]">
                Review unmatched items, then open exports when you are ready to share results with your CA.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card card-body text-center py-14">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#ebf3ff] flex items-center justify-center text-[#0b57d0] mb-4">
            <Icon d="M17 20h5v-2a3 3 0 00-4-2.83M9 20H4v-2a3 3 0 014-2.83m10-4.34a3 3 0 11-6 0 3 3 0 016 0zm-10 0a3 3 0 11-6 0 3 3 0 016 0z" />
          </div>
          <h2 className="card-title justify-center">No showroom connected yet</h2>
          <p className="text-sm text-[#4f71a5] mt-2 max-w-xl mx-auto">
            Business login is live, but you still need a showroom or connection to start syncing sales and payments.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/connect" className="btn-primary">Connect CA</Link>
            <Link href="/dashboard" className="btn-secondary">Refresh dashboard</Link>
          </div>
        </div>
      )}
    </div>
  );
}