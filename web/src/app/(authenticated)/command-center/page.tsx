'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import MotionEmptyState from '@/components/MotionEmptyState';
import LottieLoader from '@/components/LottieLoader';
import Icon from '@/components/Icon';
import { API_URL } from '@/lib/api';

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { Authorization: `Bearer ${token}` };
}

export default function CommandCenterPage() {
  const router = useRouter();

  const { data: commandCenter, isLoading } = useQuery({
    queryKey: ['command-center'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/tasks/command-center`, { headers: authHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 3 * 60 * 1000,
  });

  const { data: clientStats } = useQuery({
    queryKey: ['client-stats'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/clients/stats`, { headers: authHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: paymentSummary } = useQuery({
    queryKey: ['payment-summary'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/payments/summary`, { headers: authHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: serviceSummary } = useQuery({
    queryKey: ['service-summary'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/services/summary`, { headers: authHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const stats = [
    {
      label: 'Active Clients',
      value: clientStats?.totalActive ?? 0,
      color: '#4f46e5',
      icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    },
    {
      label: 'Pending Tasks',
      value: commandCenter?.stats?.pendingTasks ?? 0,
      color: '#fbbf24',
      icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Overdue Payments',
      value: paymentSummary?.totalOverdue ?? 0,
      color: '#ffb4ab',
      icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Active Services',
      value: serviceSummary?.activeServices ?? 0,
      color: '#4ade80',
      icon: 'M11.42 15.17l-5.67-5.67a2 2 0 010-2.83l.94-.94a2 2 0 012.83 0L15.17 11.42a2 2 0 010 2.83l-.94.94a2 2 0 01-2.83 0z',
    },
  ];

  const urgentTasks = commandCenter?.urgentTasks ?? [];
  const upcomingTasks = commandCenter?.upcomingTasks ?? [];
  const recentTasks = commandCenter?.recentTasks ?? [];

  if (isLoading) {
    return (
      <div className="animate-fade-in h-64 flex items-center justify-center">
        <LottieLoader label="Loading command center intelligence..." size={48} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <span className="pulse-dot" style={{ background: 'var(--primary-container)' }} />
            Command Center
          </h1>
          <p className="page-subtitle">Today&apos;s intelligence — what needs attention right now</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/clients')} className="btn-secondary btn-sm">
            <Icon d="M12 4.5v15m7.5-7.5h-15" className="w-3.5 h-3.5" />
            Add Client
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">{s.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${s.color}15` }}>
                <Icon d={s.icon} className="w-4 h-4" />
              </div>
            </div>
            <span className="stat-value">{s.value}</span>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '50%', background: s.color, filter: 'blur(40px)', opacity: 0.08 }} />
          </div>
        ))}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Focus Now — takes 3 cols */}
        <div className="lg:col-span-3 card">
          <div className="card-header">
            <h2 className="card-title flex items-center gap-2">
              <svg className="w-4 h-4" style={{ color: 'var(--error)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              Focus Now
            </h2>
            {urgentTasks.length > 0 && <span className="badge-red">{urgentTasks.length} urgent</span>}
          </div>
          <div className="card-body space-y-2">
            {urgentTasks.length === 0 ? (
              <MotionEmptyState
                title="All clear"
                description="No urgent items. System is calm and under control."
              />
            ) : (
              urgentTasks.slice(0, 5).map((task: any, i: number) => (
                <button
                  key={task._id || i}
                  onClick={() => task.clientId && router.push(`/clients/${task.clientId}`)}
                  className="focus-card focus-card-urgent w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ color: 'var(--on-surface)' }}>{task.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>{task.description}</p>
                      {task.dueDate && (
                        <p className="text-xs mt-1.5 tabular-nums" style={{ color: 'var(--error)' }}>
                          Due: {new Date(task.dueDate).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                    <span className="badge-red shrink-0">{task.priority || 'HIGH'}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* System Suggestions — takes 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming deadlines */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title flex items-center gap-2">
                <Icon d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4" />
                Upcoming
              </h2>
              {upcomingTasks.length > 0 && <span className="badge-yellow">{upcomingTasks.length}</span>}
            </div>
            <div className="card-body space-y-2">
              {upcomingTasks.length === 0 ? (
                <MotionEmptyState
                  title="No upcoming deadlines"
                  description="You are clear for the next cycle."
                />
              ) : (
                upcomingTasks.slice(0, 4).map((task: any, i: number) => (
                  <div key={task._id || i} className="focus-card focus-card-warning">
                    <p className="font-medium text-xs" style={{ color: 'var(--on-surface)' }}>{task.title}</p>
                    {task.dueDate && (
                      <p className="text-xs mt-1 tabular-nums" style={{ color: 'var(--warning)' }}>
                        {new Date(task.dueDate).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Quick Actions</h2>
            </div>
            <div className="card-body grid grid-cols-2 gap-2">
              {[
                { label: 'Add Client', href: '/clients', icon: 'M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z' },
                { label: 'New Task', href: '/tasks', icon: 'M12 4.5v15m7.5-7.5h-15' },
                { label: 'View Payments', href: '/payments', icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z' },
                { label: 'Knowledge', href: '/knowledge', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
              ].map((a) => (
                <button key={a.label} onClick={() => router.push(a.href)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200"
                  style={{ background: 'var(--surface-high)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-highest)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-high)'; }}
                >
                  <Icon d={a.icon} className="w-5 h-5" />
                  <span className="text-xs font-medium" style={{ color: 'var(--on-surface-variant)' }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Activity</h2>
          <button onClick={() => router.push('/tasks')} className="btn-ghost btn-sm">View all →</button>
        </div>
        <div className="card-body">
          {recentTasks.length === 0 ? (
            <MotionEmptyState
              title="No recent activity"
              description="Tasks and actions will appear here as your team executes workflow."
            />
          ) : (
            <div className="space-y-2">
              {recentTasks.slice(0, 6).map((task: any, i: number) => (
                <div key={task._id || i} className="focus-card focus-card-normal">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--on-surface)' }}>{task.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>{task.description}</p>
                    </div>
                    <span className={`badge-${task.status === 'completed' ? 'green' : task.status === 'in_progress' ? 'blue' : 'gray'}`}>
                      {task.status?.replace('_', ' ') || 'pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
