'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

export default function ExportPage() {
  const params = useParams<{ showroomId: string }>();
  const showroomId = params?.showroomId ?? '';
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportType, setExportType] = useState<'tally' | 'gst'>('tally');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gstSummary, setGstSummary] = useState<any>(null);

  const handleExport = async () => {
    if (!startDate || !endDate) { setError('Select both dates'); return; }
    setLoading(true); setError(''); setGstSummary(null);
    try {
      const endpoint = exportType === 'tally' ? 'exports/tally' : 'exports/gst-summary';
      const res = await fetch(`${API_URL}/v1/showrooms/${showroomId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ startDate, endDate }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Export failed'); }
      if (exportType === 'tally') {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `tally-${showroomId}-${Date.now()}.xlsx`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      } else {
        setGstSummary(await res.json());
      }
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <button onClick={() => router.back()} className="text-xs text-slate-400 hover:text-slate-600 mb-1">← Back</button>
          <h1 className="page-title">Export Data</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Config */}
        <div className="card card-body space-y-5">
          <div>
            <p className="input-label">Export Type</p>
            <div className="flex gap-2">
              {(['tally', 'gst'] as const).map(t => (
                <button key={t} onClick={() => setExportType(t)}
                  className={`btn-md flex-1 ${exportType === t ? 'btn-primary' : 'btn-secondary'}`}>
                  {t === 'tally' ? '📊 Tally Export' : '📋 GST Summary'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
            </div>
          </div>

          {error && <div className="alert-danger text-sm">{error}</div>}

          <button onClick={handleExport} disabled={loading || !startDate || !endDate}
            className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Generating...' : exportType === 'tally' ? 'Download Excel' : 'Generate Summary'}
          </button>

          <div className="bg-surface-50 rounded-xl p-4 text-sm text-slate-500">
            {exportType === 'tally'
              ? 'Exports all verified transactions in Tally-compatible Excel format with GST breakdown.'
              : 'Generates a GST summary grouped by tax rate (CGST/SGST/IGST) for filing preparation.'}
          </div>
        </div>

        {/* GST Summary result */}
        {gstSummary && (
          <div className="card card-body animate-slide-up">
            <h3 className="card-title mb-4">GST Summary</h3>
            <p className="text-xs text-slate-400 mb-4">
              {new Date(gstSummary.period?.startDate).toLocaleDateString('en-IN')} –{' '}
              {new Date(gstSummary.period?.endDate).toLocaleDateString('en-IN')} · {gstSummary.transactionCount} transactions
            </p>
            <table className="table text-sm">
              <thead><tr><th>Rate</th><th>Taxable</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total</th></tr></thead>
              <tbody>
                {Object.entries(gstSummary.byRate ?? {}).map(([rate, data]: any) => (
                  <tr key={rate}>
                    <td><span className="badge-purple">{rate}%</span></td>
                    <td className="tabular-nums">₹{data.taxable?.toFixed(2)}</td>
                    <td className="tabular-nums">₹{data.cgst?.toFixed(2)}</td>
                    <td className="tabular-nums">₹{data.sgst?.toFixed(2)}</td>
                    <td className="tabular-nums">₹{data.igst?.toFixed(2)}</td>
                    <td className="tabular-nums font-semibold">₹{data.total?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold bg-surface-50">
                  <td>Total</td>
                  <td className="tabular-nums">₹{gstSummary.totals?.taxable?.toFixed(2)}</td>
                  <td className="tabular-nums">₹{gstSummary.totals?.cgst?.toFixed(2)}</td>
                  <td className="tabular-nums">₹{gstSummary.totals?.sgst?.toFixed(2)}</td>
                  <td className="tabular-nums">₹{gstSummary.totals?.igst?.toFixed(2)}</td>
                  <td className="tabular-nums">₹{gstSummary.totals?.total?.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
