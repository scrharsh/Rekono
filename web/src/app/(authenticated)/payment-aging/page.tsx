'use client';

import { useQuery } from '@tanstack/react-query';
import MotionEmptyState from '@/components/MotionEmptyState';
import LottieLoader from '@/components/LottieLoader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { Authorization: `Bearer ${token}` };
}

type AgingPayment = {
  amount: number;
  dueDate: string;
  description?: string;
  clientId?: {
    name?: string;
  };
};

type AgingBucket = {
  label: string;
  items: AgingPayment[];
  color: string;
  amount: number;
};

export default function PaymentAgingPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['payment-summary'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/payments/summary`, { headers: authHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const getAgingBuckets = (payments: AgingPayment[]): AgingBucket[] => {
    const now = new Date();
    const buckets: Record<'0-30' | '30-60' | '60-90' | '90+', AgingBucket> = {
      '0-30': { label: 'Current (0-30 days)', items: [], color: '#fbbf24', amount: 0 },
      '30-60': { label: 'Past Due (30-60 days)', items: [], color: '#f97316', amount: 0 },
      '60-90': { label: 'Overdue (60-90 days)', items: [], color: '#ef4444', amount: 0 },
      '90+': { label: 'Severely Overdue (90+ days)', items: [], color: '#91091e', amount: 0 },
    };

    payments.forEach((p) => {
      const daysOverdue = Math.floor((now.getTime() - new Date(p.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      let bucket: keyof typeof buckets;

      if (daysOverdue < 30) bucket = '0-30';
      else if (daysOverdue < 60) bucket = '30-60';
      else if (daysOverdue < 90) bucket = '60-90';
      else bucket = '90+';

      buckets[bucket].items.push(p);
      buckets[bucket].amount += p.amount;
    });

    return Object.values(buckets);
  };

  const overdueBuckets = summary?.overdue?.items ? getAgingBuckets(summary.overdue.items) : [];
  const totalOverdue = summary?.totalOverdueAmount ?? 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Aging</h1>
          <p className="page-subtitle">Track overdue payments by age</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LottieLoader label="Loading aging report..." size={48} />
        </div>
      ) : !summary ? (
        <MotionEmptyState title="No data" description="Unable to load payment summary" />
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="stat-card">
              <span className="stat-label">Total Overdue</span>
              <span className="stat-value text-2xl">₹{totalOverdue.toLocaleString('en-IN')}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Overdue Count</span>
              <span className="stat-value text-2xl">{summary.overdue?.count ?? 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Pending</span>
              <span className="stat-value text-2xl">₹{(summary.totalPending ?? 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Collected</span>
              <span className="stat-value text-2xl">₹{(summary.totalCollected ?? 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Aging Buckets */}
          {overdueBuckets.length > 0 && overdueBuckets.some(b => b.items.length > 0) ? (
            <div className="space-y-4">
              {overdueBuckets
                .filter(b => b.items.length > 0)
                .map((bucket: AgingBucket, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-xl overflow-hidden"
                    style={{ background: 'var(--surface-container)' }}>
                    {/* Header */}
                    <div className="p-4 border-b" style={{ borderColor: 'var(--outline-variant)', background: bucket.color + '10' }}>
                      <div className="flex items-baseline justify-between">
                        <h3 className="font-semibold" style={{ color: bucket.color }}>
                          {bucket.label}
                        </h3>
                        <div className="text-right">
                          <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                            {bucket.items.length} payment{bucket.items.length !== 1 ? 's' : ''} • ₹{bucket.amount.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="divide-y" style={{ borderColor: 'var(--outline-variant)' }}>
                      {bucket.items.map((payment: AgingPayment, pIdx: number) => (
                        <div key={pIdx} className="p-3 flex items-center justify-between hover:bg-opacity-50" style={{ background: bucket.color + '05' }}>
                          <div className="flex-1">
                            <p className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                              {payment.clientId?.name ?? 'Unknown Client'}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
                              Due: {new Date(payment.dueDate).toLocaleDateString()} {payment.description && `• ${payment.description}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium tabular-nums" style={{ color: bucket.color }}>
                              ₹{payment.amount.toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
                              {Math.floor((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <MotionEmptyState
              title="No overdue payments"
              description="Great! All payments are up to date or pending within due dates."
            />
          )}

          {/* Pending Payments */}
          {summary.pending?.items?.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface-container)' }}>
              <div className="p-4 border-b" style={{ borderColor: 'var(--outline-variant)', background: '#fbbf2420' }}>
                <h3 className="font-semibold" style={{ color: '#fbbf24' }}>
                  Pending Payments ({summary.pending.count})
                </h3>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--outline-variant)' }}>
                {summary.pending.items.slice(0, 10).map((payment: any, idx: number) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                        {payment.clientId?.name ?? 'Unknown Client'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right tabular-nums">
                      <p className="text-sm font-medium">₹{payment.amount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
