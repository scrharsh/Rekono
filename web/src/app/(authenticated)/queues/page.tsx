'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import MotionEmptyState from '@/components/MotionEmptyState';
import LottieLoader from '@/components/LottieLoader';
import { API_URL } from '@/lib/api';

interface QueueItem {
  _id: string; amount: number; totalAmount?: number; timestamp: string; status: string;
  customerName?: string; paymentMethod?: string; transactionId?: string; sender?: string;
  items?: any[];
}

interface MatchCandidate {
  saleEntry: { _id: string; totalAmount: number; timestamp: string; customerName?: string };
  confidence: number;
  reason: string;
}

function ageLabel(ts: string) {
  const h = Math.floor((Date.now() - new Date(ts).getTime()) / 3600000);
  return h < 1 ? '<1h' : h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

export default function QueueManagementPage() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const showroomId = searchParams?.get('showroomId') ?? '';

  const [tab, setTab] = useState<'unmatched' | 'unknown'>('unmatched');
  const [unmatched, setUnmatched] = useState<QueueItem[]>([]);
  const [unknown, setUnknown] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QueueItem | null>(null);
  const [suggestions, setSuggestions] = useState<MatchCandidate[]>([]);
  const [matching, setMatching] = useState(false);

  const fetchQueues = useCallback(async () => {
    if (!showroomId) return;
    setLoading(true);
    try {
      const h = { Authorization: `Bearer ${token}` };
      const [um, uk] = await Promise.all([
        fetch(`${API_URL}/v1/showrooms/${showroomId}/queues/unmatched`, { headers: h }).then(r => r.ok ? r.json() : { items: [] }),
        fetch(`${API_URL}/v1/showrooms/${showroomId}/queues/unknown`, { headers: h }).then(r => r.ok ? r.json() : { items: [] }),
      ]);
      setUnmatched(um.items ?? um ?? []);
      setUnknown(uk.items ?? uk ?? []);
    } finally { setLoading(false); }
  }, [showroomId, token]);

  useEffect(() => { fetchQueues(); }, [fetchQueues]);

  const fetchSuggestions = async (paymentId: string) => {
    const res = await fetch(`${API_URL}/v1/showrooms/${showroomId}/matches/suggestions/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { const d = await res.json(); setSuggestions(d.suggestions ?? []); }
  };

  const handleSelect = (item: QueueItem) => {
    setSelected(item === selected ? null : item);
    setSuggestions([]);
    if (tab === 'unknown') fetchSuggestions(item._id);
  };

  const confirmMatch = async (saleId: string, paymentId: string) => {
    setMatching(true);
    try {
      const res = await fetch(`${API_URL}/v1/showrooms/${showroomId}/matches`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId, paymentId }),
      });
      if (res.ok) { setSelected(null); setSuggestions([]); fetchQueues(); }
    } finally { setMatching(false); }
  };

  const queue = tab === 'unmatched' ? unmatched : unknown;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Queue Management</h1>
          <p className="page-subtitle">Review and resolve unmatched transactions</p>
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div className="flex bg-surface-100 p-1.5 rounded-xl w-fit mb-6 shadow-inner-sm border border-slate-200/60">
        {(['unmatched', 'unknown'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setSelected(null); setSuggestions([]); }}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${tab === t ? 'bg-white text-brand-700 shadow-card' : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'unmatched' ? `Unmatched Sales (${unmatched.length})` : `Unknown Payments (${unknown.length})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Queue list */}
        <div className={`${selected ? 'lg:col-span-2' : 'lg:col-span-3'} table-wrapper`}>
          <div className="card-header">
            <h2 className="card-title">{tab === 'unmatched' ? 'Unmatched Sales' : 'Unknown Payments'}</h2>
            <span className="text-xs text-slate-400">{queue.length} items</span>
          </div>
          {loading ? (
            <div className="h-56 flex items-center justify-center p-6">
              <LottieLoader label="Loading queue intelligence..." size={46} />
            </div>
          ) : queue.length === 0 ? (
            <MotionEmptyState
              title="Queue is empty"
              description="No items need attention right now."
            />
          ) : (
            <div className="divide-y divide-slate-100/60 bg-white">
              {queue.map(item => {
                const age = ageLabel(item.timestamp);
                const isOld = Date.now() - new Date(item.timestamp).getTime() > 48 * 3600000;
                const amt = item.totalAmount ?? item.amount;
                const isSelected = selected?._id === item._id;
                return (
                  <div key={item._id} onClick={() => handleSelect(item)}
                    className={`px-5 py-4 cursor-pointer transition-all duration-200 border-l-4 group ${isSelected ? 'bg-brand-50/50 border-brand-500' : 'border-transparent hover:bg-surface-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-semibold tabular-nums text-base transition-colors ${isSelected ? 'text-brand-700' : 'text-slate-800'}`}>₹{amt.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {new Date(item.timestamp).toLocaleString('en-IN')}
                        </p>
                        {item.customerName && <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5"><svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>{item.customerName}</p>}
                        {item.paymentMethod && <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5"><svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>{item.paymentMethod}</p>}
                      </div>
                      <span className={`badge ${isOld ? 'badge-red' : 'badge-yellow'} shadow-sm`}>{age} old</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Suggestions panel */}
        {selected && (
          <div className="card animate-slide-up shadow-card-lg border-brand-100 bg-white/80 backdrop-blur-md">
            <div className="card-header bg-surface-50 border-b border-brand-100/50">
              <h3 className="card-title text-brand-900">
                {tab === 'unknown' ? 'Match Suggestions' : 'Selected Item Details'}
              </h3>
              <button onClick={() => { setSelected(null); setSuggestions([]); }} className="text-slate-400 hover:text-slate-600 transition w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-200/50">✕</button>
            </div>

            <div className="card-body">
              <div className="bg-surface-100/50 rounded-xl p-4 mb-6 text-sm border border-slate-200/40">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Source Item</p>
                <p className="text-2xl font-bold text-slate-800 tabular-nums tracking-tight">₹{(selected.totalAmount ?? selected.amount).toLocaleString('en-IN')}</p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{new Date(selected.timestamp).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'medium' })}</span>
                  {selected.transactionId && <span className="font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{selected.transactionId}</span>}
                </div>
              </div>

              {tab === 'unknown' && (
                suggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-surface-50 rounded-xl border border-dashed border-slate-300">
                    <svg className="w-10 h-10 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <p className="text-sm font-medium text-slate-600">No suggestions found</p>
                    <p className="text-xs text-slate-400 mt-1">This payment likely belongs to an unrecorded sale.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Possible Matches</p>
                    {suggestions.map((s, i) => (
                      <div key={i} className={`border rounded-xl p-4 transition-all duration-200 hover:shadow-md ${s.confidence >= 90 ? 'border-success/30 bg-success/5' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold text-lg text-slate-800 tabular-nums">₹{s.saleEntry.totalAmount.toLocaleString('en-IN')}</p>
                            <p className="text-xs text-slate-500 mt-1">{new Date(s.saleEntry.timestamp).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'medium' })}</p>
                          </div>
                          <span className={`badge ${s.confidence >= 90 ? 'badge-green' : s.confidence >= 70 ? 'badge-yellow' : 'badge-red'} shadow-sm`}>
                            {s.confidence}% Match
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-4 bg-white/50 px-2 py-1.5 rounded text-xs text-slate-600 font-medium">
                          <svg className="w-3.5 h-3.5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {s.reason}
                        </div>
                        <button
                          onClick={() => confirmMatch(s.saleEntry._id, selected._id)}
                          disabled={matching}
                          className="btn-primary w-full shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50 transition-all font-semibold">
                          {matching ? 'Securing Match...' : 'Confirm Match'}
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
