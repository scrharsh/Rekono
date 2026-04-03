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

export default function ServicePeriodsPage() {
  const qc = useQueryClient();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [periodStatus, setPeriodStatus] = useState('pending');
  const [showUpdatePeriod, setShowUpdatePeriod] = useState(false);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['ca-services'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/services`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const updatePeriodMutation = useMutation({
    mutationFn: async ({ serviceId, period, status }: { serviceId: string; period: string; status: string }) => {
      const res = await fetch(`${API_URL}/v1/ca/services/${serviceId}/period-status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ period, status }),
      });
      if (!res.ok) throw new Error('Failed to update period');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ca-services'] });
      setShowUpdatePeriod(false);
      setSelectedServiceId(null);
    },
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4ade80';
      case 'in_progress':
        return '#fbbf24';
      case 'overdue':
        return '#ffb4ab';
      default:
        return '#9ca3af';
    }
  };

  const getServicePeriodDisplay = (service: any) => {
    const type = service.serviceType;
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (service.frequency === 'monthly') {
      return `${monthNames[now.getMonth()]} 2026`;
    } else if (service.frequency === 'quarterly') {
      const q = Math.ceil((now.getMonth() + 1) / 3);
      return `Q${q} 2026`;
    } else if (service.frequency === 'annual') {
      return 'FY2025-26';
    }
    return 'One-time';
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Service Periods</h1>
          <p className="page-subtitle">Track compliance cycles and filing deadlines</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LottieLoader label="Loading service periods..." size={48} />
        </div>
      ) : services.length === 0 ? (
        <MotionEmptyState
          title="No services assigned"
          description="Assign services to clients to track their compliance periods."
        />
      ) : (
        <div className="space-y-4">
          {services.filter((s: any) => s.status === 'active').map((service: any) => {
            const latestPeriod = service.periodStatuses?.length > 0
              ? service.periodStatuses[service.periodStatuses.length - 1]
              : { status: 'pending', period: getServicePeriodDisplay(service) };

            return (
              <div
                key={service._id}
                className="rounded-xl p-4 border transition-all hover:border-opacity-75"
                style={{
                  background: 'var(--surface-container)',
                  border: '1px solid var(--outline-variant)',
                }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-semibold" style={{ color: 'var(--on-surface)' }}>
                        {service.name}
                      </h3>
                      <span className="text-xs px-2 py-1 rounded-md" style={{background: getStatusBadgeColor(latestPeriod.status) + '20', color: getStatusBadgeColor(latestPeriod.status)}}>
                        {latestPeriod.status}
                      </span>
                    </div>
                    <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
                      Period: <strong>{latestPeriod.period}</strong> • Frequency: <strong>{service.frequency.replace('_', ' ')}</strong>
                    </p>
                    {latestPeriod.completedAt && (
                      <p className="text-xs mt-2" style={{ color: 'var(--on-surface-variant)' }}>
                        Completed: {new Date(latestPeriod.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedServiceId(service._id);
                      setPeriodStatus(latestPeriod.status);
                      setShowUpdatePeriod(true);
                    }}
                    className="btn-secondary text-sm">
                    Update Status
                  </button>
                </div>

                {/* Period history */}
                {service.periodStatuses?.length > 1 && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--outline-variant)' }}>
                    <p className="text-xs font-medium mb-2" style={{ color: 'var(--on-surface-variant)' }}>
                      History
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {service.periodStatuses.slice(-3).map((period: any, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            background: getStatusBadgeColor(period.status) + '20',
                            color: getStatusBadgeColor(period.status),
                          }}>
                          {period.period}: {period.status}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Update Period Modal */}
      {showUpdatePeriod && selectedServiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(12, 26, 43, 0.34)', backdropFilter: 'blur(7px)' }}>
          <div className="w-full max-w-md animate-scale-in rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--outline-variant)', boxShadow: '0 20px 64px rgba(15, 32, 56, 0.16)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--on-surface)' }}>Update Period Status</h2>
            <div className="space-y-4">
              <div>
                <label className="input-label">Status *</label>
                <select
                  className="input"
                  value={periodStatus}
                  onChange={e => setPeriodStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpdatePeriod(false)}
                  className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updatePeriodMutation.isPending}
                  onClick={() =>
                    updatePeriodMutation.mutate({
                      serviceId: selectedServiceId,
                      period: new Date().toISOString().slice(0, 7),
                      status: periodStatus,
                    })
                  }
                  className="btn-primary">
                  {updatePeriodMutation.isPending ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
