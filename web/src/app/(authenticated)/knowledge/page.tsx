'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { Authorization: `Bearer ${token}` };
}

function Icon({ d, className = 'w-5 h-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function KnowledgePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: guides = [], isLoading } = useQuery({
    queryKey: ['knowledge-guides'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/knowledge`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: selected } = useQuery({
    queryKey: ['knowledge-detail', selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const res = await fetch(`${API_URL}/v1/ca/knowledge/${selectedId}`, { headers: authHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!selectedId,
  });

  const filtered = guides.filter((g: any) =>
    g.title?.toLowerCase().includes(search.toLowerCase()) ||
    g.category?.toLowerCase().includes(search.toLowerCase())
  );

  const categoryIcons: Record<string, string> = {
    'registration': 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    'filing': 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z',
    'compliance': 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    'scheme': 'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21',
    'tax': 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75',
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Icon d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            Knowledge Engine
          </h1>
          <p className="page-subtitle">Structured process guides & compliance answers</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" />
        <input type="search" placeholder="Search guides... (e.g. GST registration, MSME)"
          value={search} onChange={e => setSearch(e.target.value)}
          className="input pl-10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guide list */}
        <div className="lg:col-span-1 space-y-2">
          {isLoading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-20 skeleton" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state py-10">
              <p className="empty-state-title">No guides found</p>
              <p className="empty-state-desc">Try a different search term</p>
            </div>
          ) : (
            filtered.map((guide: any) => (
              <button
                key={guide._id || guide.id}
                onClick={() => setSelectedId(guide._id || guide.id)}
                className="w-full text-left p-4 rounded-xl transition-all duration-200"
                style={{
                  background: selectedId === (guide._id || guide.id) ? 'rgba(79,70,229,0.12)' : 'var(--surface-container)',
                  border: selectedId === (guide._id || guide.id) ? '1px solid var(--primary-container)' : '1px solid rgba(70,69,85,0.15)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(79,70,229,0.1)' }}>
                    <Icon d={categoryIcons[guide.category] || categoryIcons.registration} className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--on-surface)' }}>{guide.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
                      {guide.category || 'General'} • {guide.estimatedTime || '—'}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {!selectedId ? (
            <div className="card flex items-center justify-center" style={{ minHeight: 400 }}>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(79,70,229,0.1)' }}>
                  <Icon d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" className="w-8 h-8" />
                </div>
                <p className="font-semibold" style={{ color: 'var(--on-surface)' }}>Select a guide</p>
                <p className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>
                  Choose from the list to view structured steps, costs, and checklists
                </p>
              </div>
            </div>
          ) : !selected ? (
            <div className="card p-6 space-y-4">
              <div className="h-8 w-48 skeleton" />
              <div className="h-4 w-full skeleton" />
              <div className="h-4 w-3/4 skeleton" />
              <div className="h-32 skeleton" />
            </div>
          ) : (
            <div className="card animate-slide-right">
              <div className="card-header">
                <h2 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>{selected.title}</h2>
                <span className="badge-purple capitalize">{selected.category}</span>
              </div>
              <div className="card-body space-y-6">
                {/* Overview */}
                {selected.description && (
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                    {selected.description}
                  </p>
                )}

                {/* Quick info */}
                <div className="grid grid-cols-3 gap-3">
                  {selected.estimatedTime && (
                    <div className="p-3 rounded-xl" style={{ background: 'var(--surface-high)' }}>
                      <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Time</p>
                      <p className="font-semibold text-sm" style={{ color: 'var(--on-surface)' }}>{selected.estimatedTime}</p>
                    </div>
                  )}
                  {selected.estimatedCost && (
                    <div className="p-3 rounded-xl" style={{ background: 'var(--surface-high)' }}>
                      <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Cost</p>
                      <p className="font-semibold text-sm" style={{ color: 'var(--on-surface)' }}>{selected.estimatedCost}</p>
                    </div>
                  )}
                  {selected.difficulty && (
                    <div className="p-3 rounded-xl" style={{ background: 'var(--surface-high)' }}>
                      <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Difficulty</p>
                      <p className="font-semibold text-sm capitalize" style={{ color: 'var(--on-surface)' }}>{selected.difficulty}</p>
                    </div>
                  )}
                </div>

                {/* Steps */}
                {selected.steps && selected.steps.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--on-surface)' }}>Steps</h3>
                    <div className="space-y-2">
                      {selected.steps.map((step: any, i: number) => (
                        <div key={i} className="flex gap-3 p-3 rounded-xl" style={{ background: 'var(--surface-high)' }}>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: 'var(--primary-container)', color: '#fff' }}>
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                              {typeof step === 'string' ? step : step.title}
                            </p>
                            {step.description && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>{step.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required Documents */}
                {selected.requiredDocuments && selected.requiredDocuments.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--on-surface)' }}>Required Documents</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selected.requiredDocuments.map((doc: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: 'var(--surface-high)' }}>
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--primary-container)' }} />
                          <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Charges */}
                {selected.suggestedCharges && (
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.15)' }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--primary)' }}>
                      Suggested Charges
                    </p>
                    <p className="font-bold text-lg" style={{ color: 'var(--on-surface)' }}>{selected.suggestedCharges}</p>
                    {selected.chargesNote && (
                      <p className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>{selected.chargesNote}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
