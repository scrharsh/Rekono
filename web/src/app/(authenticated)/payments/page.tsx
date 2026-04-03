'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MotionEmptyState from '@/components/MotionEmptyState';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

type ClientLite = {
  _id: string;
  name: string;
};

type PaymentStatus = 'pending' | 'overdue' | 'paid';

type PaymentItem = {
  _id: string;
  clientId?: string | ClientLite;
  amount?: number;
  description?: string;
  dueDate?: string;
  status: PaymentStatus;
};

type PaymentSummary = {
  totalCollected: number;
  totalPending: number;
  totalOverdueAmount: number;
};

type PaymentCreateForm = {
  clientId: string;
  amount: string;
  description: string;
  dueDate: string;
  status: 'pending';
};

const DEFAULT_ADD_FORM: PaymentCreateForm = {
  clientId: '',
  amount: '',
  description: '',
  dueDate: '',
  status: 'pending',
};

export default function PaymentsPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<PaymentCreateForm>(DEFAULT_ADD_FORM);

  const { data: payments = [], isLoading } = useQuery<PaymentItem[]>({
    queryKey: ['ca-payments'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/payments`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json() as Promise<PaymentItem[]>;
    },
  });

  const { data: clients = [] } = useQuery<ClientLite[]>({
    queryKey: ['ca-clients-list'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/clients`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json() as Promise<ClientLite[]>;
    },
  });

  const { data: summary } = useQuery<PaymentSummary | null>({
    queryKey: ['payment-summary'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/payments/summary`, { headers: authHeaders() });
      if (!res.ok) return null;
      return res.json() as Promise<PaymentSummary>;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (body: PaymentCreateForm) => {
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

  const getClientName = (clientRef?: string | ClientLite) => {
    if (!clientRef) return '—';
    const clientId = typeof clientRef === 'string' ? clientRef : clientRef._id;
    return clients.find((c) => c._id === clientId)?.name ?? '—';
  };

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
          style={{ background: 'rgba(12, 26, 43, 0.34)', backdropFilter: 'blur(7px)' }}>
          <div className="w-full max-w-md animate-scale-in rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--outline-variant)', boxShadow: '0 20px 64px rgba(15, 32, 56, 0.16)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--on-surface)' }}>Record Payment</h2>
            <form onSubmit={e => { e.preventDefault(); addMutation.mutate(addForm); }} className="space-y-4">
              <div>
                <label className="input-label">Client *</label>
                <select className="input" value={addForm.clientId} required
                  onChange={e => setAddForm(p => ({ ...p, clientId: e.target.value }))}>
                  <option value="">Select client...</option>
                  {clients.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
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
        <MotionEmptyState
          title="No payments recorded"
          description="Start tracking client fee collections and due dates from one place."
        />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Client</th><th>Amount</th><th>Description</th><th>Due Date</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td className="font-medium">{getClientName(p.clientId)}</td>
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
