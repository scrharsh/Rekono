'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { SmartSummary } from '@/components/SmartSummary';
import Icon from '@/components/Icon';

import { BulkResolveModal } from '@/components/BulkResolveModal';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function authHeaders(token?: string | null) {
  return { Authorization: `Bearer ${token || localStorage.getItem('token')}` };
}

interface DashboardStats {
  totalSales: number;
  matchedSales: number;
  unmatchedSales: number;
  totalPayments: number;
  matchedPayments: number;
  unknownPayments: number;
  reconciliationHealth: number;
}

export default function BusinessDashboardPage() {
  const { user, token } = useAuth();
  const showroomId = useMemo(() => user?.showroomIds?.[0] ?? '', [user?.showroomIds]);
  const defaultStats: DashboardStats = {
    totalSales: 0,
    matchedSales: 0,
    unmatchedSales: 0,
    totalPayments: 0,
    matchedPayments: 0,
    unknownPayments: 0,
    reconciliationHealth: 0,
  };

  const [isBulkResolveOpen, setIsBulkResolveOpen] = useState(false);
  // Fetch dashboard stats
  const { data: stats = defaultStats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', showroomId],
    enabled: !!showroomId && !!token,
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/dashboard/showrooms/${showroomId}/stats`, {
        headers: authHeaders(token),
      });
      if (!res.ok) return defaultStats;
      return res.json() as Promise<DashboardStats>;
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch queue summaries
  useQuery({
    queryKey: ['queue-summary', showroomId],
    enabled: !!showroomId && !!token,
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/dashboard/showrooms/${showroomId}/queues`, {
        headers: authHeaders(token),
      });
      if (!res.ok) return {};
      return res.json();
    },
  });

  const quickActions = showroomId
    ? [
        { label: 'Open Showroom', href: `/showrooms/${showroomId}`, icon: 'M3 21h18M4.5 21V5.25L12 3l7.5 2.25V21M9 21v-8.25h6V21' },
        { label: 'New Sale', href: `/showrooms/${showroomId}/transactions?action=new-sale`, icon: 'M12 4.5v15m7.5-7.5h-15' },
        { label: 'New Payment', href: `/showrooms/${showroomId}/transactions?action=new-payment`, icon: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h.008v.008h-.008v-.008zm0 2h.008v.008h-.008v-.008zm0 2h.008v.008h-.008v-.008zm0 2h.008v.008h-.008v-.008zm4-8.5h.008v.008H5.75v-.008zm0 2h.008v.008H5.75v-.008zm0 2h.008v.008H5.75v-.008zm0 2h.008v.008H5.75v-.008zm4-8.5h.008v.008h-.008v-.008zm0 2h.008v.008h-.008v-.008zm0 2h.008v.008h-.008v-.008zm0 2h.008v.008h-.008v-.008z' },
        { label: 'Export', href: `/showrooms/${showroomId}/export`, icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
      ]
    : [
        { label: 'Connect CA', href: '/connect', icon: 'M17 20h5v-2a3 3 0 00-4-2.83M9 20H4v-2a3 3 0 014-2.83m10-4.34a3 3 0 11-6 0 3 3 0 016 0zm-10 0a3 3 0 11-6 0 3 3 0 016 0z' },
        { label: 'Help', href: '/help-requests', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      ];

  const statCards = [
    {
      label: 'Sales Today',
      value: stats.totalSales ?? 0,
      unit: 'INR',
      icon: 'M12 6v6m0 0v6m0-6h6m0 0h6m-6-6H6m0 0H0',
      color: 'text-[#0b57d0]',
      bgColor: 'bg-[#eef4ff]',
    },
    {
      label: 'Matched',
      value: stats.matchedSales ?? 0,
      unit: '#',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'text-[#0d7c5f]',
      bgColor: 'bg-[#e7f7f2]',
    },
    {
      label: 'Unmatched',
      value: stats.unmatchedSales ?? 0,
      unit: '#',
      icon: 'M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'text-[#a05e08]',
      bgColor: 'bg-[#fff2db]',
    },
    {
      label: 'Health Score',
      value: Math.round(stats.reconciliationHealth ?? 0),
      unit: '%',
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      color: stats.reconciliationHealth >= 80 ? 'text-[#0d7c5f]' : stats.reconciliationHealth >= 60 ? 'text-[#a05e08]' : 'text-[#d13438]',
      bgColor: stats.reconciliationHealth >= 80 ? 'bg-[#e7f7f2]' : stats.reconciliationHealth >= 60 ? 'bg-[#fff2db]' : 'bg-[#fde8e8]',
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">Business OS</p>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Real-time reconciliation and transaction activity</p>
        </div>
        {showroomId && <span className="badge-blue">Active Showroom</span>}
      </div>

      {showroomId ? (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="card card-body rounded-xl border border-[#dbe7ff] p-4 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#4f71a5]">
                      {stat.label}
                    </p>
                    <p className={`text-2xl font-bold mt-2 tabular-nums ${stat.color}`}>
                      {typeof stat.value === 'number' ? stat.value.toLocaleString('en-IN') : stat.value}
                      <span className="text-xs ml-1 opacity-75">{stat.unit}</span>
                    </p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon d={stat.icon} className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Smart Summary */}
            <div className="lg:col-span-2">
              <SmartSummary showroomId={showroomId} />

              {/* Queue Summary Cards */}
              <div className="mt-6 flex items-center gap-4 justify-between">
                <h3 className="text-sm font-semibold text-[#153c74]">Queue Summary</h3>
                {(stats.unmatchedSales ?? 0) + (stats.unknownPayments ?? 0) > 0 && (
                  <button
                    onClick={() => setIsBulkResolveOpen(true)}
                    className="btn-secondary text-xs px-3 py-2"
                  >
                    <Icon d="M12 4v16m8-8H4" className="w-3 h-3" />
                    Bulk Resolve
                  </button>
                )}
              </div>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Unmatched Sales',
                    count: stats.unmatchedSales ?? 0,
                    action: 'Review',
                    href: `/queues?type=unmatched&showroomId=${showroomId}`,
                    color: '#a05e08',
                    bgColor: '#fff2db',
                  },
                  {
                    title: 'Unknown Payments',
                    count: stats.unknownPayments ?? 0,
                    action: 'Resolve',
                    href: `/queues?type=unknown&showroomId=${showroomId}`,
                    color: '#d13438',
                    bgColor: '#fde8e8',
                  },
                ].map((q) => (
                  <Link
                    key={q.title}
                    href={q.href}
                    className="card card-body p-4 border transition hover:shadow-lg hover:border-[#0b57d0]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[#4f71a5] uppercase tracking-wider">
                          {q.title}
                        </p>
                        <p className="text-2xl font-bold mt-1 tabular-nums" style={{ color: q.color }}>
                          {q.count}
                        </p>
                      </div>
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: q.bgColor }}
                      >
                        <span style={{ color: q.color }} className="text-xl font-bold">
                          {q.count > 0 ? '!' : '✓'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[#0b57d0] font-semibold mt-3">{q.action} →</p>
                  </Link>
                ))}
              </div>
            </div>

                    {/* Bulk Resolve Modal */}
                    {showroomId && (
                      <BulkResolveModal
                        isOpen={isBulkResolveOpen}
                        onClose={() => setIsBulkResolveOpen(false)}
                        showroomId={showroomId}
                        onSuccess={() => {
                          // Refetch stats after successful bulk resolve
                          window.location.reload();
                        }}
                      />
                    )}
            {/* Right: Quick Actions */}
            <div className="card card-body space-y-4">
              <div>
                <h2 className="card-title">Quick Actions</h2>
                <p className="text-xs text-[#4f71a5] mt-1">Continue your workflow</p>
              </div>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-3 rounded-xl border border-[#dbe7ff] bg-[#f7fbff] px-3.5 py-2.5 text-sm hover:border-[#0b57d0] hover:bg-[#eef4ff] transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#dbe7ff] flex items-center justify-center text-[#0b57d0] flex-shrink-0">
                      <Icon d={action.icon} className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-[#153c74]">{action.label}</p>
                    </div>
                    <Icon d="M13 7l5 5m0 0l-5 5m5-5H6" className="w-3 h-3 text-[#4f71a5]" />
                  </Link>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-[#f7fbff] border border-[#dbe7ff] p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#0b57d0]">
                  💡 Tip
                </p>
                <p className="mt-2 text-xs text-[#4f71a5] leading-relaxed">
                  Resolve exceptions first—once all items are matched, you can export to share with your CA.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card card-body text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#ebf3ff] flex items-center justify-center text-[#0b57d0] mb-4">
            <Icon d="M17 20h5v-2a3 3 0 00-4-2.83M9 20H4v-2a3 3 0 014-2.83m10-4.34a3 3 0 11-6 0 3 3 0 016 0zm-10 0a3 3 0 11-6 0 3 3 0 016 0z" className="w-8 h-8" />
          </div>
          <h2 className="card-title justify-center text-lg">No showroom connected</h2>
          <p className="text-sm text-[#4f71a5] mt-3 max-w-md mx-auto">
            To start reconciling, you need to create or connect a showroom. Connect with your CA to get started.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/connect" className="btn-primary">
              <Icon d="M12 4v16m8-8H4" className="w-4 h-4" />
              Connect CA
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}