'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import TimelineView from '@/components/TimelineView';
import { SmartSummary } from '@/components/SmartSummary';
import MotionEmptyState from '@/components/MotionEmptyState';
import LottieLoader from '@/components/LottieLoader';
import { API_URL } from '@/lib/api';

interface Showroom { _id: string; name: string; gstin: string; address: string; phone: string; }
interface HealthScore {
  score: number;
  breakdown: { base: number; deductions: Array<{ reason: string; amount: number; value: string }>; };
}

function ScoreRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="80" height="80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <span className="text-lg font-bold text-slate-800 tabular-nums">{score}</span>
    </div>
  );
}

export default function ShowroomDetailPage() {
  const params = useParams<{ showroomId: string }>();
  const showroomId = params?.showroomId ?? '';
  const { token } = useAuth();
  const router = useRouter();
  const [showroom, setShowroom] = useState<Showroom | null>(null);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!showroomId) return;
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API_URL}/v1/showrooms/${showroomId}`, { headers: h }).then(r => r.ok ? r.json() : null).then(setShowroom),
      fetch(`${API_URL}/v1/ca-os/health-score/${showroomId}`, { headers: h }).then(r => r.ok ? r.json() : null).then(setHealthScore),
    ]).finally(() => setLoading(false));
  }, [showroomId, token]);

  if (loading) {
    return (
      <div className="animate-fade-in h-72 flex items-center justify-center">
        <LottieLoader label="Loading business intelligence..." size={48} />
      </div>
    );
  }

  if (!showroom) {
    return (
      <MotionEmptyState
        title="Business not found"
        description="This business may be unavailable or you might not have access."
      />
    );
  }

  const actions = [
    { label: 'Transactions', href: `/showrooms/${showroomId}/transactions`, color: 'btn-primary', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Export Data', href: `/showrooms/${showroomId}/export`, color: 'btn-secondary', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
    { label: 'Review Queues', href: `/queues?showroomId=${showroomId}`, color: 'btn-secondary', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
        <button onClick={() => router.push('/dashboard')} className="hover:text-slate-600 transition">Dashboard</button>
        <span>/</span>
        <span className="text-slate-600 font-medium">{showroom.name}</span>
      </div>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{showroom.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{showroom.gstin}</span>
            <span className="text-xs text-slate-400">{showroom.phone}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions.map(a => (
            <button key={a.label} onClick={() => router.push(a.href)} className={a.color}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
              </svg>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Health + info row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {/* Health score card */}
        {healthScore && (
          <div className="card card-body flex items-center gap-4 lg:col-span-1">
            <ScoreRing score={healthScore.score} />
            <div>
              <p className="stat-label">Health Score</p>
              <p className="text-xs text-slate-500 mt-1">
                {healthScore.score >= 80 ? 'Excellent' : healthScore.score >= 60 ? 'Needs attention' : 'Critical'}
              </p>
              {healthScore.breakdown.deductions.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {healthScore.breakdown.deductions.slice(0, 2).map((d, i) => (
                    <p key={i} className="text-2xs text-danger">−{d.amount} {d.reason}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Address card */}
        <div className="card card-body lg:col-span-3">
          <p className="stat-label mb-2">Business Details</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="text-slate-400 text-xs">Address</span>
              <p className="text-slate-700 mt-0.5">{showroom.address}</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs">Phone</span>
              <p className="text-slate-700 mt-0.5">{showroom.phone}</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs">GSTIN</span>
              <p className="font-mono text-slate-700 mt-0.5">{showroom.gstin}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Smart summary + timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SmartSummary showroomId={showroomId} />
        <TimelineView showroomId={showroomId} />
      </div>
    </div>
  );
}
