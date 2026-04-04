'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/api';
import MotionEmptyState from './MotionEmptyState';
import LottieLoader from './LottieLoader';

interface SmartSummaryData {
  period: { start: string; end: string };
  totalSales: number;
  totalGST: number;
  transactionCount: number;
  filingStatus: 'filed' | 'pending' | 'overdue';
  unresolvedIssues: number;
}

interface Props { showroomId: string; startDate?: Date; endDate?: Date; }

const PERIODS = [
  { key: 'current_month', label: 'This Month' },
  { key: 'last_month',    label: 'Last Month' },
] as const;

export const SmartSummary = ({ showroomId, startDate, endDate }: Props) => {
  const { token } = useAuth();
  const [summary, setSummary] = useState<SmartSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'current_month' | 'last_month'>('current_month');

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const start = period === 'current_month'
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = period === 'current_month'
        ? now
        : new Date(now.getFullYear(), now.getMonth(), 0);

      const params = new URLSearchParams({
        startDate: (startDate ?? start).toISOString(),
        endDate:   (endDate   ?? end).toISOString(),
      });

      const res = await fetch(
        `${API_URL}/v1/dashboard/showrooms/${showroomId}/summary?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) setSummary(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [showroomId, token, period, startDate, endDate]);

  useEffect(() => {
    fetchSummary();
    const id = setInterval(fetchSummary, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchSummary]);

  const filingBadge = {
    filed:   <span className="badge-green">Filed</span>,
    pending: <span className="badge-yellow">Pending</span>,
    overdue: <span className="badge-red">Overdue</span>,
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Smart Summary</h3>
        <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-0.5">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition ${
                period === p.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card-body">
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <LottieLoader label="Loading summary..." size={40} />
          </div>
        ) : !summary ? (
          <MotionEmptyState
            title="No data available"
            description="Summary data appears once transactions sync in this period."
          />
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-50 rounded-xl p-3">
                <p className="text-2xs font-medium text-brand-600 uppercase tracking-wide">Total Sales</p>
                <p className="text-xl font-bold text-brand-700 mt-1 tabular-nums">
                  ₹{summary.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-success/5 rounded-xl p-3">
                <p className="text-2xs font-medium text-success-dark uppercase tracking-wide">Total GST</p>
                <p className="text-xl font-bold text-success mt-1 tabular-nums">
                  ₹{summary.totalGST.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500">Transactions</span>
                <span className="text-sm font-bold text-slate-800 tabular-nums">{summary.transactionCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500">Issues</span>
                <span className={`text-sm font-bold tabular-nums ${summary.unresolvedIssues > 0 ? 'text-danger' : 'text-success'}`}>
                  {summary.unresolvedIssues}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">Filing Status</span>
              {filingBadge[summary.filingStatus]}
            </div>

            <p className="text-2xs text-slate-400">
              {new Date(summary.period.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              {' – '}
              {new Date(summary.period.end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
