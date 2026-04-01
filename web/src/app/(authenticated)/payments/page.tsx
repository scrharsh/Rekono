'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function PaymentsPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ clientId: '', amount: '', description: '', dueDate: '' });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['ca-payments'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/payments`, { headers: authHeaders() });
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
    queryKey: ['payment-summary'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/payments/summary`, { headers: authHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch(`${API_URL}/v1/ca/payments`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ ...body, amount: Number(body.amount) }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ca-payments'] }); qc.invalidateQueries({ queryKey: ['payment-summary'] }); setShowAdd(false); },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/v1/ca/payments/${id}/mark-paid`, {
        method: 'PUT', headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ca-payments'] }); qc.invalidateQueries({ queryKey: ['payment-summary'] }); },
  });

  const stats = [
    { label: 'Total Collected', value: `₹${(summary?.totalCollected ?? 0).toLocaleString('en-IN')}`, color: '#4ade80' },
    { label: 'Pending', value: `₹${(summary?.totalPending ?? 0).toLocaleString('en-IN')}`, color: '#fbbf24' },
    { label: 'Overdue', value: `₹${(summary?.totalOverdueAmount ?? 0).toLocaleString('en-IN')}`, color: '#ffb4ab' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments & Collections</h1>
          <p className="page-subtitle">Track all client fee collections</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">+ Record Payment</button>
      </div>

      <div className="grid grid-cols-3 gap-4 stagger-children">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value text-2xl" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md animate-scale-in rounded-2xl p-6"
            style={{ background: 'var(--surface-container)', border: '1px solid rgba(70,69,85,0.2)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--on-surface)' }}>Record Payment</h2>
            <form onSubmit={e => { e.preventDefault(); addMutation.mutate(addForm); }} className="space-y-4">
              <div>
                <label className="input-label">Client *</label>
                <select className="input" value={addForm.clientId} required
                  onChange={e => setAddForm(p => ({ ...p, clientId: e.target.value }))}>
                  <option value="">Select client...</option>
                  {clients.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Amount (₹) *</label>
                  <input className="input" type="number" value={addForm.amount} required
                    onChange={e => setAddForm(p => ({ ...p, amount: e.target.value }))} placeholder="5000" />
                </div>
                <div>
                  <label className="input-label">Due Date</label>
                  <input className="input" type="date" value={addForm.dueDate}
                    onChange={e => setAddForm(p => ({ ...p, dueDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="input-label">Description</label>
                <input className="input" value={addForm.description}
                  onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} placeholder="GST Filing - April" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={addMutation.isPending} className="btn-primary">
                  {addMutation.isPending ? 'Saving...' : 'Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 skeleton" />)}</div>
      ) : payments.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No payments recorded</p>
          <p className="empty-state-desc">Start tracking client fee collections</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Client</th><th>Amount</th><th>Description</th><th>Due Date</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {payments.map((p: any) => (
                <tr key={p._id}>
                  <td className="font-medium">{p.clientId?.name ?? clients.find((c: any) => c._id === p.clientId)?.name ?? '—'}</td>
                  <td className="tabular-nums font-semibold">₹{p.amount?.toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--on-surface-variant)' }}>{p.description || '—'}</td>
                  <td className="tabular-nums text-xs">{p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                  <td>
                    <span className={`badge-${p.status === 'paid' ? 'green' : p.status === 'overdue' ? 'red' : 'yellow'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    {p.status !== 'paid' && (
                      <button onClick={() => markPaidMutation.mutate(p._id)} className="btn-ghost btn-sm text-xs">
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
