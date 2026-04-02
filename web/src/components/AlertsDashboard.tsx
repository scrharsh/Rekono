'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MotionEmptyState from './MotionEmptyState';
import LottieLoader from './LottieLoader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Alert {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  showroomId: string;
  showroomName?: string;
}

const SEV_CONFIG = {
  critical: { badge: 'badge-red',    row: 'border-l-2 border-danger',   icon: 'text-danger'  },
  high:     { badge: 'badge-yellow', row: 'border-l-2 border-warning',  icon: 'text-warning' },
  medium:   { badge: 'badge-blue',   row: 'border-l-2 border-info',     icon: 'text-info'    },
};

export const AlertsDashboard = () => {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');

  const fetchAlerts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (severityFilter) params.append('urgency', severityFilter);
      const res = await fetch(`${API_URL}/v1/ca-os/alerts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setAlerts(d.alerts || []); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [token, severityFilter]);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 60000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const res = await fetch(`${API_URL}/v1/ca-os/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch { /* silent */ }
  };

  const critical = alerts.filter(a => a.severity === 'critical');
  const high      = alerts.filter(a => a.severity === 'high');
  const medium    = alerts.filter(a => a.severity === 'medium');

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pending Alerts</h1>
          <p className="page-subtitle">{alerts.length} alerts across all clients</p>
        </div>
        <div className="flex items-center gap-2">
          {['', 'critical', 'high', 'medium'].map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`btn-sm ${severityFilter === s ? 'btn-primary' : 'btn-secondary'}`}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="stat-card border-l-4 border-danger hover:-translate-y-1 hover:shadow-lg transition-all duration-300 bg-white/50 backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <span className="stat-label text-danger">Critical</span>
            <span className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center text-danger">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </span>
          </div>
          <span className="stat-value text-slate-800">{critical.length}</span>
        </div>
        
        <div className="stat-card border-l-4 border-warning hover:-translate-y-1 hover:shadow-lg transition-all duration-300 bg-white/50 backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <span className="stat-label text-warning-dark">High</span>
            <span className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center text-warning-dark">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
          </div>
          <span className="stat-value text-slate-800">{high.length}</span>
        </div>
        
        <div className="stat-card border-l-4 border-info hover:-translate-y-1 hover:shadow-lg transition-all duration-300 bg-white/50 backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <span className="stat-label text-info-dark">Medium</span>
            <span className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center text-info-dark">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
          </div>
          <span className="stat-value text-slate-800">{medium.length}</span>
        </div>
      </div>

      {/* Alerts table */}
      <div className="table-wrapper shadow-card-md">
        <div className="card-header">
          <h2 className="card-title">All Alerts</h2>
        </div>
        {loading ? (
          <div className="h-56 flex items-center justify-center p-6">
            <LottieLoader label="Loading alert intelligence..." size={46} />
          </div>
        ) : alerts.length === 0 ? (
          <MotionEmptyState
            title="All clear"
            description="No pending alerts at this time."
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Alert</th>
                <th>Showroom</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert: Alert) => {
                const cfg = SEV_CONFIG[alert.severity];
                return (
                  <tr key={alert.id} className={cfg.row}>
                    <td><span className={cfg.badge}>{alert.severity}</span></td>
                    <td>
                      <p className="font-medium text-slate-800">{alert.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{alert.description}</p>
                    </td>
                    <td className="text-slate-500">{alert.showroomName ?? '—'}</td>
                    <td><span className="badge-gray">{alert.type.replace(/_/g, ' ')}</span></td>
                    <td>
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="btn-accent btn-sm text-xs opacity-90 hover:opacity-100 shadow-none border border-black/5"
                      >
                        Acknowledge
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
