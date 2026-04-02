'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import MotionEmptyState from '@/components/MotionEmptyState';
import Icon from '@/components/Icon';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function HealthBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--error)';
  const label = score >= 80 ? 'Healthy' : score >= 60 ? 'At Risk' : 'Critical';
  const bg = score >= 80 ? 'rgba(74,222,128,0.12)' : score >= 60 ? 'rgba(251,191,36,0.12)' : 'rgba(255,180,171,0.12)';
  return (
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ background: bg, color, border: `2px solid ${color}` }}>
        {score}
      </div>
      <span className="text-xs font-medium" style={{ color }}>{label}</span>
    </div>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [addForm, setAddForm] = useState({ name: '', gstin: '', phone: '', email: '', businessType: 'proprietor', notes: '' });

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['ca-clients-list'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/clients`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (body: typeof addForm) => {
      const res = await fetch(`${API_URL}/v1/ca/clients`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to add client');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ca-clients-list'] });
      setShowAdd(false);
      setAddForm({ name: '', gstin: '', phone: '', email: '', businessType: 'proprietor', notes: '' });
    },
  });

  const filtered = clients.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.gstin?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{clients.length} clients managed</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Icon d="M12 4.5v15m7.5-7.5h-15" className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" />
        <input type="search" placeholder="Search clients..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="input pl-10" />
      </div>

      {/* Add Client Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md animate-scale-in rounded-2xl p-6"
            style={{ background: 'var(--surface-container)', border: '1px solid rgba(70,69,85,0.2)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--on-surface)' }}>Add New Client</h2>
            <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate(addForm); }} className="space-y-4">
              <div>
                <label className="input-label">Client Name *</label>
                <input className="input" value={addForm.name} required
                  onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Sharma Traders" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">GSTIN</label>
                  <input className="input" value={addForm.gstin}
                    onChange={e => setAddForm(p => ({ ...p, gstin: e.target.value }))}
                    placeholder="22AAAAA0000A1Z5" />
                </div>
                <div>
                  <label className="input-label">Business Type</label>
                  <select className="input" value={addForm.businessType}
                    onChange={e => setAddForm(p => ({ ...p, businessType: e.target.value }))}>
                    {['proprietor', 'pvt_ltd', 'partnership', 'llp', 'trust', 'huf', 'other'].map(t => (
                      <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Phone</label>
                  <input className="input" value={addForm.phone}
                    onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="input-label">Email</label>
                  <input className="input" type="email" value={addForm.email}
                    onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="client@example.com" />
                </div>
              </div>
              <div>
                <label className="input-label">Notes</label>
                <input className="input" value={addForm.notes}
                  onChange={e => setAddForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Any additional notes..." />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={addMutation.isPending || !addForm.name} className="btn-primary">
                  {addMutation.isPending ? 'Adding...' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <MotionEmptyState
          title="No clients yet"
          description="Start with your first client profile to activate the CA workspace pipeline."
          action={<button onClick={() => setShowAdd(true)} className="btn-primary">Add Client</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
          {filtered.map((client: any) => (
            <button
              key={client._id}
              onClick={() => router.push(`/clients/${client._id}`)}
              className="card text-left p-5 transition-all duration-200 hover:border-indigo-500/30"
              style={{ borderColor: 'rgba(70,69,85,0.15)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold" style={{ color: 'var(--on-surface)' }}>{client.name}</p>
                  {client.gstin && (
                    <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>{client.gstin}</p>
                  )}
                </div>
                <HealthBadge score={client.healthScore ?? 0} />
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                <span className="capitalize">{client.businessType?.replace('_', ' ') || '—'}</span>
                <span>•</span>
                <span className={`badge-${client.status === 'active' ? 'green' : 'gray'}`}>
                  {client.status || 'active'}
                </span>
              </div>
              {client.phone && (
                <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: 'var(--on-surface-variant)' }}>
                  <Icon d="M2.25 4.5a1.5 1.5 0 011.5-1.5h2.25a1.5 1.5 0 011.406.976l1.106 2.767a1.5 1.5 0 01-.296 1.57l-.99.99a12.042 12.042 0 005.697 5.697l.99-.99a1.5 1.5 0 011.57-.296l2.767 1.106a1.5 1.5 0 01.976 1.406v2.25a1.5 1.5 0 01-1.5 1.5h-.75C9.65 21 3 14.35 3 6v-.75z" className="w-3.5 h-3.5" />
                  {client.phone}
                </p>
              )}
              {/* Progress bar for health */}
              <div className="progress-bar mt-3">
                <div className="progress-bar-fill" style={{
                  width: `${client.healthScore ?? 0}%`,
                  background: (client.healthScore ?? 0) >= 80 ? 'var(--success)'
                    : (client.healthScore ?? 0) >= 60 ? 'var(--warning)' : 'var(--error)',
                }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
