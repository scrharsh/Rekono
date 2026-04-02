'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import MotionEmptyState from '@/components/MotionEmptyState';
import LottieLoader from '@/components/LottieLoader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const REPORT_TYPE_LABEL: Record<string, string> = {
  tally: 'Tally Export',
  gst_summary: 'GST Summary',
  sales: 'Sales Report',
  custom: 'Custom Report',
};

export default function ReportsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['ca-reports-full'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/dashboard/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const res = await fetch(`${API_URL}/v1/connections/reports/${reportId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ca-reports-full'] }),
  });

  const unread = reports.filter((r: any) => r.status === 'unread').length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Reports sent to you by connected showrooms</p>
        </div>
        {unread > 0 && <span className="badge-blue">{unread} new</span>}
      </div>

      <div className="table-wrapper">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center p-6">
            <LottieLoader label="Loading reports..." size={46} />
          </div>
        ) : reports.length === 0 ? (
          <MotionEmptyState
            title="No reports yet"
            description="When a connected showroom sends a GST summary or Tally export, it will appear here."
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Showroom</th>
                <th>Type</th>
                <th>Period</th>
                <th>File</th>
                <th>Notes</th>
                <th>Received</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r: any) => (
                <tr key={r._id} className={r.status === 'unread' ? 'bg-brand-50/30' : ''}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {r.showroomId?.name?.[0] ?? '?'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{r.showroomId?.name ?? '—'}</p>
                        <p className="text-xs font-mono text-slate-400">{r.showroomId?.gstin}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge-purple">{REPORT_TYPE_LABEL[r.reportType] ?? r.reportType}</span></td>
                  <td className="text-slate-500 text-xs">{r.period}</td>
                  <td>
                    <span className="text-xs font-mono text-slate-600">{r.fileName}</span>
                  </td>
                  <td className="text-slate-500 text-xs max-w-[160px] truncate">{r.notes ?? '—'}</td>
                  <td className="text-slate-500 tabular-nums text-xs">
                    {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    {r.status === 'unread'
                      ? <span className="badge-blue">New</span>
                      : <span className="badge-gray">Read</span>}
                  </td>
                  <td>
                    {r.status === 'unread' && (
                      <button onClick={() => markReadMutation.mutate(r._id)}
                        className="btn-ghost btn-sm text-xs">
                        Mark read
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
