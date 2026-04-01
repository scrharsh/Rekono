'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { Authorization: `Bearer ${token}` };
}

const DOC_TYPES = [
  { value: 'pan', label: 'PAN Card' },
  { value: 'gst_certificate', label: 'GST Certificate' },
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'bank_details', label: 'Bank Details' },
  { value: 'address_proof', label: 'Address Proof' },
  { value: 'agreement', label: 'Agreement' },
  { value: 'other', label: 'Other' },
];

function Icon({ d, className = 'w-4 h-4' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function DocumentsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ clientId: '', documentType: 'pan' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filter, setFilter] = useState('all');

  const { data: clients = [] } = useQuery({
    queryKey: ['ca-clients-list'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/clients`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch documents per client (aggregated)
  const { data: allDocs = [], isLoading } = useQuery({
    queryKey: ['ca-documents-all'],
    queryFn: async () => {
      // Fetch completeness for each client
      const results = await Promise.all(
        clients.map(async (c: any) => {
          try {
            const res = await fetch(`${API_URL}/v1/ca/documents/completeness/${c._id}`, { headers: authHeaders() });
            if (!res.ok) return { client: c, documents: [], percentage: 0 };
            const data = await res.json();
            return { client: c, ...data };
          } catch {
            return { client: c, documents: [], percentage: 0 };
          }
        })
      );
      return results;
    },
    enabled: clients.length > 0,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('No file selected');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('clientId', uploadForm.clientId);
      formData.append('documentType', uploadForm.documentType);
      const res = await fetch(`${API_URL}/v1/ca/documents/upload`, {
        method: 'POST',
        headers: { Authorization: authHeaders().Authorization },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ca-documents-all'] });
      setShowUpload(false);
      setSelectedFile(null);
    },
  });

  const filteredDocs = filter === 'all'
    ? allDocs
    : filter === 'complete'
      ? allDocs.filter((d: any) => d.percentage >= 100)
      : allDocs.filter((d: any) => d.percentage < 100);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">Central document hub for all clients</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn-primary">
          <Icon d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          Upload
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-high)' }}>
        {[
          { id: 'all', label: 'All Clients' },
          { id: 'incomplete', label: 'Incomplete' },
          { id: 'complete', label: 'Complete' },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => setFilter(tab.id)}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filter === tab.id ? 'var(--primary-container)' : 'transparent',
              color: filter === tab.id ? '#fff' : 'var(--on-surface-variant)',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md animate-scale-in rounded-2xl p-6"
            style={{ background: 'var(--surface-container)', border: '1px solid rgba(70,69,85,0.2)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--on-surface)' }}>Upload Document</h2>
            <form onSubmit={e => { e.preventDefault(); uploadMutation.mutate(); }} className="space-y-4">
              <div>
                <label className="input-label">Client *</label>
                <select className="input" value={uploadForm.clientId} required
                  onChange={e => setUploadForm(p => ({ ...p, clientId: e.target.value }))}>
                  <option value="">Select client...</option>
                  {clients.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Document Type *</label>
                <select className="input" value={uploadForm.documentType}
                  onChange={e => setUploadForm(p => ({ ...p, documentType: e.target.value }))}>
                  {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">File *</label>
                <input ref={fileRef} type="file" className="hidden"
                  onChange={e => setSelectedFile(e.target.files?.[0] ?? null)} />
                <button type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full p-6 rounded-xl border-2 border-dashed transition-colors text-center"
                  style={{ borderColor: selectedFile ? 'var(--primary-container)' : 'var(--outline-variant)', background: 'var(--surface-high)' }}>
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>{selectedFile.name}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Icon d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>Click to select file</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(199,196,216,0.5)' }}>PDF, JPG, PNG up to 10MB</p>
                    </div>
                  )}
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowUpload(false); setSelectedFile(null); }} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={uploadMutation.isPending || !selectedFile || !uploadForm.clientId} className="btn-primary">
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document completeness per client */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 skeleton" />)}</div>
      ) : filteredDocs.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No clients found</p>
          <p className="empty-state-desc">Add clients first to track their documents</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {filteredDocs.map((item: any) => (
            <div key={item.client?._id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold" style={{ color: 'var(--on-surface)' }}>{item.client?.name}</p>
                  <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{item.client?.gstin || 'No GSTIN'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tabular-nums" style={{
                    color: item.percentage >= 100 ? 'var(--success)' : item.percentage >= 50 ? 'var(--warning)' : 'var(--error)'
                  }}>
                    {item.percentage ?? 0}%
                  </span>
                </div>
              </div>
              <div className="progress-bar mb-3" style={{ height: 6 }}>
                <div className="progress-bar-fill" style={{
                  width: `${item.percentage ?? 0}%`,
                  background: item.percentage >= 100 ? 'var(--success)' : item.percentage >= 50 ? 'var(--warning)' : 'var(--error)',
                }} />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {DOC_TYPES.slice(0, 6).map(dt => {
                  const found = item.documents?.find((d: any) => d.type === dt.value);
                  return (
                    <div key={dt.value} className="flex items-center gap-1.5 py-1">
                      {found?.uploaded ? (
                        <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--error)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{dt.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
