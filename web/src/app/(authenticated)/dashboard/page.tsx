'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { Authorization: `Bearer ${token}` };
}

export default function DashboardPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['ca-summary'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/dashboard/summary`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: caosHome } = useQuery({
    queryKey: ['ca-os-home'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca-os/home`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['ca-clients'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/dashboard/clients`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['ca-requests'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/dashboard/requests`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['ca-reports'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/dashboard/reports`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await fetch(`${API_URL}/v1/connections/${connectionId}/accept`, {
        method: 'PATCH', headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ca-requests'] }); qc.invalidateQueries({ queryKey: ['ca-clients'] }); qc.invalidateQueries({ queryKey: ['ca-summary'] }); },
  });

  const rejectMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await fetch(`${API_URL}/v1/connections/${connectionId}/reject`, {
        method: 'PATCH', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ca-requests'] }),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  const today = caosHome?.today;
  const tasksByUrgency = today?.tasksByUrgency ?? { high: [], medium: [], low: [] };
  const alertsBySeverity = today?.alertsBySeverity ?? { critical: [], high: [], medium: [] };
  const intelligentClients = today?.perClient ?? [];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">CA Operating System</h1>
          <p className="page-subtitle">Today’s intelligence — tasks, alerts, and next best actions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card border-brand-500">
          <span className="stat-label">Urgent Clients</span>
          <span className="stat-value">{today?.urgentClients ?? 0}</span>
        </div>
        <div className="stat-card border-warning">
          <span className="stat-label">High Priority Tasks</span>
          <span className="stat-value">{tasksByUrgency.high?.length ?? 0}</span>
        </div>
        <div className="stat-card border-brand-600">
          <span className="stat-label">Critical Alerts</span>
          <span className="stat-value">{alertsBySeverity.critical?.length ?? 0}</span>
        </div>
        <div className="stat-card border-slate-300">
          <span className="stat-label">Clients In Scope</span>
          <span className="stat-value">{today?.totalClients ?? summary?.connectedClients ?? 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today tasks */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Today: Tasks by Urgency</h2>
            {(tasksByUrgency.high?.length ?? 0) + (tasksByUrgency.medium?.length ?? 0) + (tasksByUrgency.low?.length ?? 0) > 0 && (
              <span className="badge-yellow">
                {(tasksByUrgency.high?.length ?? 0) + (tasksByUrgency.medium?.length ?? 0) + (tasksByUrgency.low?.length ?? 0)} total
              </span>
            )}
          </div>
          <div className="card-body">
            {tasksByUrgency.high?.length + tasksByUrgency.medium?.length + tasksByUrgency.low?.length === 0 ? (
              <div className="empty-state py-8">
                <p className="empty-state-title">All clear for now</p>
                <p className="empty-state-desc">No pending tasks from rules at this moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { key: 'high', title: 'Urgent', badge: 'badge-red', items: tasksByUrgency.high ?? [] },
                  { key: 'medium', title: 'This Week', badge: 'badge-yellow', items: tasksByUrgency.medium ?? [] },
                  { key: 'low', title: 'Later', badge: 'badge-gray', items: tasksByUrgency.low ?? [] },
                ].map((group: any) => (
                  <div key={group.key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`badge ${group.badge}`}>{group.title}</span>
                      <span className="text-xs text-slate-400">{group.items.length} items</span>
                    </div>
                    <div className="space-y-2">
                      {group.items.slice(0, 4).map((t: any) => (
                        <button
                          key={t.id}
                          onClick={() => router.push(`/showrooms/${t.showroomId ?? ''}`)}
                          className="w-full text-left p-3 bg-surface-50 rounded-xl border border-slate-100 hover:border-slate-300 transition"
                        >
                          <p className="font-semibold text-sm text-slate-800">{t.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                          {t.dueDate && (
                            <p className="text-2xs text-slate-400 mt-1 tabular-nums">
                              Due: {new Date(t.dueDate).toLocaleDateString('en-IN')}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recommended actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">What should I do next?</h2>
            {(today?.recommendations?.length ?? 0) > 0 && <span className="badge-blue">{today.recommendations.length} picks</span>}
          </div>
          <div className="card-body">
            {today?.recommendations?.length === 0 ? (
              <div className="empty-state py-8">
                <p className="empty-state-title">No recommendations</p>
                <p className="empty-state-desc">Your rule set is currently calm.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {today.recommendations.map((a: any) => (
                  <button
                    key={a.id}
                    onClick={() => router.push(`/showrooms/${a.showroomId ?? ''}`)}
                    className="w-full text-left p-3 bg-white rounded-xl border border-slate-100 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{a.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{a.reason}</p>
                      </div>
                      <span className={`badge ${a.kind === 'alert' ? (a.severity === 'critical' ? 'badge-red' : a.severity === 'high' ? 'badge-yellow' : 'badge-gray') : (a.priority === 'high' ? 'badge-red' : a.priority === 'medium' ? 'badge-yellow' : 'badge-gray')}`}>
                        {a.kind === 'alert' ? a.severity : a.priority}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending connection requests */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Connection Requests</h2>
            {requests.length > 0 && <span className="badge-yellow">{requests.length} pending</span>}
          </div>
          <div className="card-body">
            {requests.length === 0 ? (
              <div className="empty-state py-8">
                <p className="empty-state-title">No pending requests</p>
                <p className="empty-state-desc">Showrooms will appear here when they request to connect with you</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((r: any) => (
                  <div key={r.connectionId} className="flex items-start justify-between p-3 bg-surface-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{r.showroom?.name}</p>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{r.showroom?.gstin}</p>
                      {r.message && <p className="text-xs text-slate-500 mt-1 italic">&ldquo;{r.message}&rdquo;</p>}
                      <p className="text-xs text-slate-400 mt-1">{new Date(r.requestedAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-3">
                      <button onClick={() => acceptMutation.mutate(r.connectionId)}
                        className="btn-primary btn-sm">Accept</button>
                      <button onClick={() => rejectMutation.mutate(r.connectionId)}
                        className="btn-secondary btn-sm">Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Connected clients */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Connected Clients</h2>
            <span className="text-xs text-slate-400">{(intelligentClients.length ? intelligentClients.length : clients.length)} total</span>
          </div>
          <div className="card-body">
            {(intelligentClients.length ? intelligentClients.length : clients.length) === 0 ? (
              <div className="empty-state py-8">
                <p className="empty-state-title">No clients yet</p>
                <p className="empty-state-desc">Accept connection requests to start receiving reports from showrooms</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(intelligentClients.length ? intelligentClients : clients).map((c: any) => {
                  const name = c.showroomName ?? c.showroom?.name ?? c.showroom?.showroomName;
                  const gstin = c.gstin ?? c.showroom?.gstin;
                  const healthScore = typeof c.healthScore === 'number' ? c.healthScore : c.health?.score ?? 0;
                  const pendingTasks = c.pendingTasks ?? 0;
                  const pendingAlerts = c.pendingAlerts ?? 0;
                  const healthBadge =
                    healthScore >= 80 ? 'badge-green' : healthScore >= 60 ? 'badge-yellow' : 'badge-red';
                  const healthLabel = healthScore >= 80 ? 'Healthy' : healthScore >= 60 ? 'Needs attention' : 'Critical';

                  return (
                    <div
                      key={c.showroomId ?? c.connectionId}
                      className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-slate-100"
                    >
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{name ?? '—'}</p>
                        <p className="text-xs font-mono text-slate-400">{gstin ?? '—'}</p>
                        <p className="text-2xs text-slate-500 mt-1 tabular-nums">
                          Pending: {pendingTasks + pendingAlerts}
                        </p>
                      </div>
                      <span className={healthBadge}>{healthLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Received reports */}
      <div className="table-wrapper">
        <div className="card-header">
          <h2 className="card-title">Received Reports</h2>
          <button onClick={() => router.push('/reports')} className="btn-ghost btn-sm text-brand-600">View all →</button>
        </div>
        {reports.length === 0 ? (
          <div className="empty-state py-12">
            <p className="empty-state-title">No reports yet</p>
            <p className="empty-state-desc">Connected showrooms can send you GST summaries and Tally exports here</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Showroom</th>
                <th>Report Type</th>
                <th>Period</th>
                <th>File</th>
                <th>Received</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.slice(0, 10).map((r: any) => (
                <tr key={r._id}>
                  <td className="font-medium">{r.showroomId?.name ?? '—'}</td>
                  <td><span className="badge-purple">{r.reportType?.replace('_', ' ')}</span></td>
                  <td className="text-slate-500 text-xs">{r.period}</td>
                  <td className="text-xs font-mono text-slate-500">{r.fileName}</td>
                  <td className="text-slate-500 tabular-nums text-xs">{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    {r.status === 'unread'
                      ? <span className="badge-blue">New</span>
                      : <span className="badge-gray">Read</span>}
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
