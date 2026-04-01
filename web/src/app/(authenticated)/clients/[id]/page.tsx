'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { Authorization: `Bearer ${token}` };
}

function Icon({ d, className = 'w-4 h-4' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function ClientWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const clientId = (params?.id as string) ?? '';

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['client-workspace', clientId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/clients/${clientId}/workspace`, { headers: authHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!clientId,
  });

  const { data: completeness } = useQuery({
    queryKey: ['doc-completeness', clientId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/documents/completeness/${clientId}`, { headers: authHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 skeleton" />)}
        </div>
      </div>
    );
  }

  const client = workspace?.client;
  const services = workspace?.services ?? [];
  const payments = workspace?.payments ?? [];
  const tasks = workspace?.tasks ?? [];

  const healthScore = client?.healthScore ?? 0;
  const healthColor = healthScore >= 80 ? 'var(--success)' : healthScore >= 60 ? 'var(--warning)' : 'var(--error)';

  const sections = [
    { label: 'Services', value: services.length, color: '#4f46e5', icon: 'M11.42 15.17l-5.67-5.67a2 2 0 010-2.83l.94-.94a2 2 0 012.83 0L15.17 11.42a2 2 0 010 2.83l-.94.94a2 2 0 01-2.83 0z' },
    { label: 'Pending Tasks', value: tasks.filter((t: any) => t.status !== 'completed').length, color: '#fbbf24', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Pending Amount', value: `₹${payments.filter((p: any) => p.status === 'pending' || p.status === 'overdue').reduce((s: number, p: any) => s + (p.amount || 0), 0).toLocaleString('en-IN')}`, color: '#ffb4ab', icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75' },
    { label: 'Docs Complete', value: `${completeness?.percentage ?? 0}%`, color: '#60a5fa', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back button + header */}
      <div>
        <button onClick={() => router.push('/clients')} className="btn-ghost btn-sm mb-3"
          style={{ color: 'var(--on-surface-variant)' }}>
          <Icon d="M15 19l-7-7 7-7" /> Back to Clients
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">{client?.name ?? 'Client'}</h1>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: `${healthColor}15`, color: healthColor, border: `2px solid ${healthColor}` }}>
                {healthScore}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-1">
              {client?.gstin && <span className="text-xs font-mono" style={{ color: 'var(--on-surface-variant)' }}>{client.gstin}</span>}
              <span className="text-xs capitalize" style={{ color: 'var(--on-surface-variant)' }}>{client?.businessType?.replace('_', ' ')}</span>
              <span className={`badge-${client?.status === 'active' ? 'green' : 'gray'}`}>
                {client?.status ?? 'active'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {sections.map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value text-2xl">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Active Services</h2>
            <span className="badge-purple">{services.length}</span>
          </div>
          <div className="card-body space-y-2">
            {services.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: 'var(--on-surface-variant)' }}>No services assigned</p>
            ) : services.map((s: any) => (
              <div key={s._id} className="focus-card focus-card-normal">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--on-surface)' }}>{s.serviceName}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
                      ₹{s.fees?.toLocaleString('en-IN') ?? 0}/{s.frequency ?? 'month'}
                    </p>
                  </div>
                  <span className={`badge-${s.status === 'active' ? 'green' : 'gray'}`}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Pending Tasks</h2>
            <span className="badge-yellow">{tasks.filter((t: any) => t.status !== 'completed').length}</span>
          </div>
          <div className="card-body space-y-2">
            {tasks.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: 'var(--on-surface-variant)' }}>No tasks</p>
            ) : tasks.filter((t: any) => t.status !== 'completed').slice(0, 5).map((t: any) => (
              <div key={t._id} className={`focus-card ${t.priority === 'high' ? 'focus-card-urgent' : t.priority === 'medium' ? 'focus-card-warning' : 'focus-card-normal'}`}>
                <p className="font-medium text-sm" style={{ color: 'var(--on-surface)' }}>{t.title}</p>
                {t.dueDate && (
                  <p className="text-xs mt-1 tabular-nums" style={{ color: 'var(--on-surface-variant)' }}>
                    Due: {new Date(t.dueDate).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payments */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Payments</h2>
          </div>
          <div className="card-body space-y-2">
            {payments.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: 'var(--on-surface-variant)' }}>No payment records</p>
            ) : payments.slice(0, 5).map((p: any) => (
              <div key={p._id} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'var(--surface-high)' }}>
                <div>
                  <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--on-surface)' }}>
                    ₹{p.amount?.toLocaleString('en-IN') ?? 0}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{p.description || 'Payment'}</p>
                </div>
                <span className={`badge-${p.status === 'paid' ? 'green' : p.status === 'overdue' ? 'red' : 'yellow'}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Document Completeness</h2>
            <span className="badge-blue">{completeness?.percentage ?? 0}%</span>
          </div>
          <div className="card-body">
            <div className="progress-bar mb-4" style={{ height: 8 }}>
              <div className="progress-bar-fill" style={{ width: `${completeness?.percentage ?? 0}%` }} />
            </div>
            <div className="space-y-2">
              {(completeness?.documents ?? []).map((doc: any) => (
                <div key={doc.type} className="flex items-center justify-between py-1.5">
                  <span className="text-xs capitalize" style={{ color: 'var(--on-surface-variant)' }}>
                    {doc.type?.replace('_', ' ')}
                  </span>
                  {doc.uploaded ? (
                    <span className="badge-green">✓ Uploaded</span>
                  ) : (
                    <span className="badge-red">Missing</span>
                  )}
                </div>
              ))}
              {(!completeness?.documents || completeness.documents.length === 0) && (
                <p className="text-xs text-center py-2" style={{ color: 'var(--on-surface-variant)' }}>No document tracking available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
