'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MotionEmptyState from '@/components/MotionEmptyState';
import LottieLoader from '@/components/LottieLoader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

type ClientLite = {
  _id: string;
  name: string;
};

type ServiceStatus = 'active' | 'inactive';

type ServiceItem = {
  _id: string;
  clientId?: string | ClientLite;
  serviceType?: string;
  name: string;
  frequency?: string;
  fees?: number;
  status: ServiceStatus;
};

type ServiceSummary = {
  totalServices: number;
  activeServices: number;
  monthlyRevenue: number;
};

type ServiceCreateForm = {
  clientId: string;
  serviceType: string;
  name: string;
  frequency: string;
  fees: string;
  startDate: string;
};

const DEFAULT_ADD_FORM: ServiceCreateForm = {
  clientId: '',
  serviceType: 'gst_filing',
  name: '',
  frequency: 'monthly',
  fees: '',
  startDate: '',
};

export default function ServicesPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<ServiceCreateForm>(DEFAULT_ADD_FORM);

  const { data: services = [], isLoading } = useQuery<ServiceItem[]>({
    queryKey: ['ca-services'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/services`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json() as Promise<ServiceItem[]>;
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

  const { data: summary } = useQuery<ServiceSummary | null>({
    queryKey: ['service-summary'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/services/summary`, { headers: authHeaders() });
      if (!res.ok) return null;
      return res.json() as Promise<ServiceSummary>;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (body: ServiceCreateForm) => {
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

  const getClientName = (clientRef?: string | ClientLite) => {
    if (!clientRef) return '—';
    const clientId = typeof clientRef === 'string' ? clientRef : clientRef._id;
    return clients.find((c) => c._id === clientId)?.name ?? '—';
  };

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
          style={{ background: 'rgba(12, 26, 43, 0.34)', backdropFilter: 'blur(7px)' }}>
          <div className="w-full max-w-md animate-scale-in rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--outline-variant)', boxShadow: '0 20px 64px rgba(15, 32, 56, 0.16)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--on-surface)' }}>Assign Service</h2>
            <form onSubmit={e => { e.preventDefault(); addMutation.mutate(addForm); }} className="space-y-4">
              <div>
                <label className="input-label">Client *</label>
                <select className="input" value={addForm.clientId} required
                  onChange={e => setAddForm(p => ({ ...p, clientId: e.target.value }))}>
                  <option value="">Select client...</option>
                  {clients.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Service Type *</label>
                <select className="input" value={addForm.serviceType} required
                  onChange={e => setAddForm(p => ({ ...p, serviceType: e.target.value }))}>
                  <option value="gst_filing">GST Filing</option>
                  <option value="gst_registration">GST Registration</option>
                  <option value="income_tax_filing">Income Tax Filing</option>
                  <option value="tds_return">TDS Return</option>
                  <option value="company_incorporation">Company Incorporation</option>
                  <option value="msme_registration">MSME Registration</option>
                  <option value="import_export_code">Import-Export Code</option>
                  <option value="consultation">Consultation</option>
                  <option value="compliance_review">Compliance Review</option>
                  <option value="bookkeeping">Bookkeeping</option>
                  <option value="audit">Audit</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="input-label">Service Name *</label>
                <input className="input" value={addForm.name} required
                  onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. GST Filing for FY2025-26" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Frequency</label>
                  <select className="input" value={addForm.frequency}
                    onChange={e => setAddForm(p => ({ ...p, frequency: e.target.value }))}>
                    {['monthly', 'quarterly', 'annual', 'one_time'].map(f => (
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
        <div className="h-64 flex items-center justify-center">
          <LottieLoader label="Loading service portfolio..." size={46} />
        </div>
      ) : services.length === 0 ? (
        <MotionEmptyState
          title="No services assigned"
          description="Assign your first service to a client to activate recurring workflow."
        />
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
              {services.map((s) => (
                <tr key={s._id}>
                  <td className="font-medium">{getClientName(s.clientId)}</td>
                  <td>{s.name}</td>
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
