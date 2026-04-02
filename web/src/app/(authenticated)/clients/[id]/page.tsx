'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import MotionEmptyState from '@/components/MotionEmptyState';
import LottieLoader from '@/components/LottieLoader';
import Icon from '@/components/Icon';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { Authorization: `Bearer ${token}` };
}

export default function ClientWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const clientId = (params?.id as string) ?? '';
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'payments' | 'documents' | 'tasks'>('overview');

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
      <div className="animate-fade-in h-72 flex items-center justify-center">
        <LottieLoader label="Loading client workspace..." size={50} />
      </div>
    );
  }

  const client = workspace?.client;
  const services = workspace?.services ?? [];
  const payments = workspace?.payments ?? [];
  const tasks = workspace?.tasks ?? [];

  const healthScore = client?.healthScore ?? 0;
  const healthColor = healthScore >= 80 ? 'var(--success)' : healthScore >= 60 ? 'var(--warning)' : 'var(--error)';
  const pendingTasks = tasks.filter((task: any) => task.status !== 'completed');
  const pendingAmount = payments
    .filter((payment: any) => payment.status === 'pending' || payment.status === 'overdue')
    .reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
  const missingDocuments = (completeness?.documents ?? []).filter((document: any) => !document.uploaded);

  const sections = [
    { label: 'Services', value: services.length, color: '#4f46e5', icon: 'M11.42 15.17l-5.67-5.67a2 2 0 010-2.83l.94-.94a2 2 0 012.83 0L15.17 11.42a2 2 0 010 2.83l-.94.94a2 2 0 01-2.83 0z' },
    { label: 'Pending Tasks', value: pendingTasks.length, color: '#fbbf24', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Pending Amount', value: `₹${pendingAmount.toLocaleString('en-IN')}`, color: '#ffb4ab', icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75' },
    { label: 'Docs Complete', value: `${completeness?.percentage ?? 0}%`, color: '#60a5fa', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  ];

  const workspaceTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'services', label: 'Services' },
    { id: 'payments', label: 'Payments' },
    { id: 'documents', label: 'Documents' },
    { id: 'tasks', label: 'Tasks' },
  ] as const;

  const quickActions = [
    { label: 'Add Service', onClick: () => router.push('/services') },
    { label: 'Create Task', onClick: () => router.push('/tasks') },
    { label: 'Upload Document', onClick: () => router.push('/documents') },
  ];

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Client Snapshot</h2>
          <span className="badge-indigo">Health {healthScore}</span>
        </div>
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Business Type</span>
            <span className="text-sm font-medium capitalize" style={{ color: 'var(--on-surface)' }}>{client?.businessType?.replace('_', ' ') ?? 'Unknown'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Services</span>
            <span className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>{services.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Open Tasks</span>
            <span className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>{pendingTasks.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Documents Missing</span>
            <span className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>{missingDocuments.length}</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {quickActions.map((action) => (
              <button key={action.label} onClick={action.onClick} className="btn-secondary btn-sm">
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Attention Required</h2>
          <span className="badge-yellow">{pendingTasks.length + missingDocuments.length}</span>
        </div>
        <div className="card-body space-y-2">
          {pendingTasks.length === 0 && missingDocuments.length === 0 ? (
            <MotionEmptyState
              title="No urgent items"
              description="Client workspace is stable with no immediate actions pending."
            />
          ) : (
            <>
              {pendingTasks.slice(0, 3).map((task: any) => (
                <div key={task._id} className="focus-card focus-card-warning">
                  <p className="font-medium text-sm" style={{ color: 'var(--on-surface)' }}>{task.title}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>Task due {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : 'soon'}</p>
                </div>
              ))}
              {missingDocuments.slice(0, 3).map((document: any) => (
                <div key={document.type} className="focus-card focus-card-normal">
                  <p className="font-medium text-sm" style={{ color: 'var(--on-surface)' }}>{document.type?.replace('_', ' ')}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>Document missing</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Active Services</h2>
        <button onClick={() => router.push('/services')} className="btn-ghost btn-sm">Open Services</button>
      </div>
      <div className="card-body space-y-2">
        {services.length === 0 ? (
          <MotionEmptyState
            title="No services assigned"
            description="Attach services to enable lifecycle and billing workflows."
          />
        ) : services.map((service: any) => (
          <div key={service._id} className="focus-card focus-card-normal">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--on-surface)' }}>{service.serviceName}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
                  ₹{service.fees?.toLocaleString('en-IN') ?? 0}/{service.frequency ?? 'month'}
                </p>
              </div>
              <span className={`badge-${service.status === 'active' ? 'green' : 'gray'}`}>{service.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Payments</h2>
        <span className="badge-red">₹{pendingAmount.toLocaleString('en-IN')}</span>
      </div>
      <div className="card-body space-y-2">
        {payments.length === 0 ? (
          <MotionEmptyState
            title="No payment records"
            description="Payment history will populate as collections are tracked."
          />
        ) : payments.map((payment: any) => (
          <div key={payment._id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--surface-high)' }}>
            <div>
              <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--on-surface)' }}>
                ₹{payment.amount?.toLocaleString('en-IN') ?? 0}
              </p>
              <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{payment.description || 'Payment'}</p>
            </div>
            <span className={`badge-${payment.status === 'paid' ? 'green' : payment.status === 'overdue' ? 'red' : 'yellow'}`}>
              {payment.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Document Completeness</h2>
        <button onClick={() => router.push('/documents')} className="btn-ghost btn-sm">Open Documents</button>
      </div>
      <div className="card-body space-y-4">
        <div className="progress-bar" style={{ height: 8 }}>
          <div className="progress-bar-fill" style={{ width: `${completeness?.percentage ?? 0}%` }} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {(completeness?.documents ?? []).map((document: any) => (
            <div key={document.type} className="flex items-center justify-between py-1.5 px-3 rounded-xl" style={{ background: 'var(--surface-low)' }}>
              <span className="text-xs capitalize" style={{ color: 'var(--on-surface-variant)' }}>
                {document.type?.replace('_', ' ')}
              </span>
              {document.uploaded ? (
                <span className="badge-green">✓ Uploaded</span>
              ) : (
                <span className="badge-red">Missing</span>
              )}
            </div>
          ))}
        </div>
        {missingDocuments.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface-high)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>Still missing</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {missingDocuments.map((document: any) => (
                <span key={document.type} className="badge-gray">{document.type?.replace('_', ' ')}</span>
              ))}
            </div>
          </div>
        )}
        {(!completeness?.documents || completeness.documents.length === 0) && (
          <MotionEmptyState
            title="No document tracking"
            description="Enable document checklist to monitor compliance coverage."
          />
        )}
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Pending Tasks</h2>
        <button onClick={() => router.push('/tasks')} className="btn-ghost btn-sm">Open Tasks</button>
      </div>
      <div className="card-body space-y-2">
        {pendingTasks.length === 0 ? (
          <MotionEmptyState
            title="No pending tasks"
            description="Task queue is clear for this client."
          />
        ) : pendingTasks.map((task: any) => (
          <div key={task._id} className={`focus-card ${task.priority === 'high' ? 'focus-card-urgent' : task.priority === 'medium' ? 'focus-card-warning' : 'focus-card-normal'}`}>
            <p className="font-medium text-sm" style={{ color: 'var(--on-surface)' }}>{task.title}</p>
            {task.dueDate && (
              <p className="text-xs mt-1 tabular-nums" style={{ color: 'var(--on-surface-variant)' }}>
                Due: {new Date(task.dueDate).toLocaleDateString('en-IN')}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

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

      <div className="flex flex-wrap gap-2 rounded-2xl p-2" style={{ background: 'var(--surface-container)', border: '1px solid rgba(214,228,255,0.95)' }}>
        {workspaceTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {sections.map((section) => (
          <div key={section.label} className="stat-card">
            <span className="stat-label">{section.label}</span>
            <span className="stat-value text-2xl">{section.value}</span>
          </div>
        ))}
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'services' && renderServices()}
      {activeTab === 'payments' && renderPayments()}
      {activeTab === 'documents' && renderDocuments()}
      {activeTab === 'tasks' && renderTasks()}
    </div>
  );
}
