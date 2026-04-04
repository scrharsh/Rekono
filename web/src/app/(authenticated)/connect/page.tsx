'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/api';
import MotionEmptyState from '@/components/MotionEmptyState';

function authHeaders(token: string | null) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

type SearchResult = {
  id: string;
  username: string;
};

type ConnectionRecord = {
  id: string;
  status: 'active' | 'pending' | 'rejected' | 'disconnected';
  connectedAt?: string;
  ca?: {
    username?: string;
  };
};

export default function ConnectCAPage() {
  const { token } = useAuth();

  const [showroomId, setShowroomId] = useState('');
  const [caUsername, setCaUsername] = useState('');
  const [message, setMessage] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);

  // Get existing connections for a showroom
  const { data: connections = [], refetch } = useQuery<ConnectionRecord[]>({
    queryKey: ['showroom-connections', showroomId],
    queryFn: async () => {
      if (!showroomId) return [];
      const res = await fetch(`${API_URL}/v1/connections/showroom/${showroomId}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) return [];
      return res.json() as Promise<ConnectionRecord[]>;
    },
    enabled: !!showroomId,
  });

  const searchCA = useCallback(async () => {
    if (!caUsername.trim()) return;
    setSearching(true); setSearchError(''); setSearchResult(null);
    try {
      const res = await fetch(`${API_URL}/v1/connections/ca/search/${caUsername.trim()}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) { setSearchError('CA not found on this platform'); return; }
      setSearchResult((await res.json()) as SearchResult);
    } catch { setSearchError('Search failed'); }
    finally { setSearching(false); }
  }, [caUsername, token]);

  const requestMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/v1/connections/request`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ showroomId, caUsername: caUsername.trim(), message }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      setSearchResult(null); setCaUsername(''); setMessage('');
      refetch();
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await fetch(`${API_URL}/v1/connections/${connectionId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
        body: JSON.stringify({ showroomId }),
      });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => refetch(),
  });

  const STATUS_BADGE: Record<string, string> = {
    active: 'badge-green', pending: 'badge-yellow',
    rejected: 'badge-red', disconnected: 'badge-gray',
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Connect your business</h1>
          <p className="page-subtitle">Link your store, agency, or business with your Chartered Accountant on Rekono</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search & Connect */}
        <div className="card card-body space-y-5">
          <h3 className="card-title">Find your CA partner</h3>

          <div className="input-group">
            <label className="input-label">Your Business ID</label>
            <input className="input" placeholder="Enter your business ID"
              value={showroomId} onChange={e => setShowroomId(e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">CA&apos;s Rekono Username</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input className="input pl-9" placeholder="e.g. rajesh_ca"
                  value={caUsername} onChange={e => setCaUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchCA()} />
              </div>
              <button onClick={searchCA} disabled={searching || !caUsername}
                className="btn-primary px-6 disabled:opacity-50 transition-all shadow-md">
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {searchError && (
            <div className="alert-danger text-sm">{searchError}</div>
          )}

          {searchResult && (
            <div className="bg-white border border-brand-200 shadow-card-md rounded-xl p-5 animate-slide-up">
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-brand-50 shadow-inner text-brand-600 flex items-center justify-center font-bold text-lg">
                  {searchResult.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800 text-base tracking-tight">{searchResult.username}</p>
                    <span className="badge-green shadow-sm">Verified CA</span>
                  </div>
                    <p className="text-sm text-slate-500 mt-0.5">Ready to connect your business workspace on Rekono</p>
                </div>
              </div>

              <div className="input-group mb-5">
                <label className="input-label text-slate-600">Message to CA (optional)</label>
                <input className="input bg-surface-50" placeholder="Hi, I'd like to connect my business for GST filing..."
                  value={message} onChange={e => setMessage(e.target.value)} />
              </div>

              {requestMutation.isError && (
                <div className="alert-danger text-sm mb-4 bg-danger/5">{(requestMutation.error as Error).message}</div>
              )}

              <button onClick={() => requestMutation.mutate()}
                disabled={requestMutation.isPending || !showroomId}
                className="btn-primary w-full shadow-md text-base py-2.5 disabled:opacity-50 transition-all font-semibold">
                {requestMutation.isPending ? 'Sending request securely...' : 'Send Business Connection Request'}
              </button>
            </div>
          )}

          <div className="bg-brand-50 rounded-xl p-4 text-sm text-brand-700">
              <p className="font-semibold mb-1">How it works</p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-brand-600">
              <li>Search for your CA by their Rekono username</li>
              <li>Send a connection request from your business workspace</li>
              <li>Once they accept, you can send them reports</li>
              <li>Your CA uses those reports for GST filing and compliance</li>
            </ol>
          </div>
        </div>

        {/* Existing connections */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Your Connections</h3>
            <span className="text-xs text-slate-400">{connections.length} total</span>
          </div>
          <div className="card-body">
            {!showroomId ? (
              <p className="text-sm text-slate-400 text-center py-8">Enter your business ID to see connections</p>
            ) : connections.length === 0 ? (
              <MotionEmptyState
                title="No connections yet"
                description="Search for your CA and send a request to initiate the bridge."
              />
            ) : (
              <div className="space-y-3">
                {connections.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{c.ca?.username}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {c.connectedAt ? `Connected ${new Date(c.connectedAt).toLocaleDateString('en-IN')}` : 'Pending'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={STATUS_BADGE[c.status] ?? 'badge-gray'}>{c.status}</span>
                      {c.status === 'active' && (
                        <button onClick={() => disconnectMutation.mutate(c.id)}
                          className="btn-ghost btn-sm text-xs text-danger hover:bg-danger-light">
                          Disconnect
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
