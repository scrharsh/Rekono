'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function ServicesPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ clientId: '', serviceName: '', frequency: 'monthly', fees: '', startDate: '' });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['ca-services'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/services`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['ca-clients-list'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/clients`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: summary } = useQuery({
    queryKey: ['service-summary'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/services/summary`, { headers: authHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch(`${API_URL}/v1/ca/services`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ ...body, fees: Number(body.fees) }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ca-services'] }); qc.invalidateQueries({ queryKey: ['service-summary'] }); setShowAdd(false); },
  });

  const stats = [
    { label: 'Total Services', value: summary?.totalServices ?? services.length },
    { label: 'Active', value: summary?.activeServices ?? 0 },
    { label: 'Monthly Revenue', value: `₹${(summary?.monthlyRevenue ?? 0).toLocaleString('en-IN')}` },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Services</h1>
          <p className="page-subtitle">Track services across all clients</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          + Assign Service
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value text-2xl">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md animate-scale-in rounded-2xl p-6"
            style={{ background: 'var(--surface-container)', border: '1px solid rgba(70,69,85,0.2)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--on-surface)' }}>Assign Service</h2>
            <form onSubmit={e => { e.preventDefault(); addMutation.mutate(addForm); }} className="space-y-4">
              <div>
                <label className="input-label">Client *</label>
                <select className="input" value={addForm.clientId} required
                  onChange={e => setAddForm(p => ({ ...p, clientId: e.target.value }))}>
                  <option value="">Select client...</option>
                  {clients.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Service Name *</label>
                <input className="input" value={addForm.serviceName} required
                  onChange={e => setAddForm(p => ({ ...p, serviceName: e.target.value }))}
                  placeholder="e.g. GST Filing" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Frequency</label>
                  <select className="input" value={addForm.frequency}
                    onChange={e => setAddForm(p => ({ ...p, frequency: e.target.value }))}>
                    {['monthly', 'quarterly', 'yearly', 'one_time'].map(f => (
                      <option key={f} value={f}>{f.replace('_', '-')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Fees (₹)</label>
                  <input className="input" type="number" value={addForm.fees}
                    onChange={e => setAddForm(p => ({ ...p, fees: e.target.value }))}
                    placeholder="2000" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={addMutation.isPending} className="btn-primary">
                  {addMutation.isPending ? 'Saving...' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 skeleton" />)}</div>
      ) : services.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No services assigned</p>
          <p className="empty-state-desc">Assign your first service to a client</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Service</th>
                <th>Frequency</th>
                <th>Fees</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s: any) => (
                <tr key={s._id}>
                  <td className="font-medium">{s.clientId?.name ?? clients.find((c: any) => c._id === s.clientId)?.name ?? '—'}</td>
                  <td>{s.serviceName}</td>
                  <td className="capitalize">{s.frequency?.replace('_', '-')}</td>
                  <td className="tabular-nums">₹{s.fees?.toLocaleString('en-IN') ?? 0}</td>
                  <td><span className={`badge-${s.status === 'active' ? 'green' : 'gray'}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
