'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import MotionEmptyState from '@/components/MotionEmptyState';
import LottieLoader from '@/components/LottieLoader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const STATUS_BADGE: Record<string, string> = {
  matched:     'badge-green',
  verified:    'badge-green',
  unmatched:   'badge-red',
  partial:     'badge-yellow',
  discrepancy: 'badge-red',
};

export default function TransactionListPage() {
  const params = useParams<{ showroomId: string }>();
  const showroomId = params?.showroomId ?? '';
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [filter, setFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', showroomId, filter, page],
    queryFn: async () => {
      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const res = await fetch(
        `${API_URL}/v1/showrooms/${showroomId}/sales?limit=50&offset=${(page - 1) * 50}${statusParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const transactions = data?.sales || [];
  const hasMore = data?.hasMore || false;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <button onClick={() => router.back()} className="text-xs text-slate-400 hover:text-slate-600 mb-1 flex items-center gap-1">
            ← Back
          </button>
          <h1 className="page-title">Transactions</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/showrooms/${showroomId}/export`} className="btn-secondary">
            Export
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        {(['all', 'matched', 'unmatched'] as const).map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            className={`btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">{data?.total ?? 0} total</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Table */}
        <div className={`${selected ? 'lg:col-span-2' : 'lg:col-span-3'} table-wrapper`}>
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>GST</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6}><div className="h-56 flex items-center justify-center"><LottieLoader label="Loading transactions..." size={44} /></div></td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6}><MotionEmptyState title="No transactions found" description="Transactions for this showroom will appear here." /></td></tr>
              ) : transactions.map((t: any) => (
                <tr key={t._id} onClick={() => setSelected(t === selected ? null : t)}
                  className={`cursor-pointer ${selected?._id === t._id ? 'bg-brand-50' : ''}`}>
                  <td><span className="font-mono text-xs">{t.invoiceNumber ?? '—'}</span></td>
                  <td className="font-medium">{t.customerName ?? 'Cash Sale'}</td>
                  <td className="text-slate-500 tabular-nums">{new Date(t.timestamp).toLocaleDateString('en-IN')}</td>
                  <td className="tabular-nums font-medium">₹{t.totalAmount?.toLocaleString('en-IN')}</td>
                  <td className="tabular-nums text-slate-500">₹{(t.cgst + t.sgst + (t.igst || 0)).toFixed(2)}</td>
                  <td><span className={STATUS_BADGE[t.status] ?? 'badge-gray'}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-secondary btn-sm disabled:opacity-40">Previous</button>
            <span className="text-xs text-slate-500">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={!hasMore}
              className="btn-secondary btn-sm disabled:opacity-40">Next</button>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="card card-body animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">Transaction Detail</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Invoice</span><span className="font-mono">{selected.invoiceNumber ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Customer</span><span>{selected.customerName ?? 'Cash Sale'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Date</span><span>{new Date(selected.timestamp).toLocaleString('en-IN')}</span></div>
              <div className="divider" />
              <div className="flex justify-between"><span className="text-slate-500">Taxable</span><span className="tabular-nums">₹{selected.taxableAmount?.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">CGST</span><span className="tabular-nums">₹{selected.cgst?.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">SGST</span><span className="tabular-nums">₹{selected.sgst?.toFixed(2)}</span></div>
              {selected.igst > 0 && <div className="flex justify-between"><span className="text-slate-500">IGST</span><span className="tabular-nums">₹{selected.igst?.toFixed(2)}</span></div>}
              <div className="flex justify-between font-semibold border-t border-slate-100 pt-2">
                <span>Total</span><span className="tabular-nums">₹{selected.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="divider" />
              <div className="flex justify-between"><span className="text-slate-500">Status</span><span className={STATUS_BADGE[selected.status] ?? 'badge-gray'}>{selected.status}</span></div>
              {selected.items?.length > 0 && (
                <div>
                  <p className="text-slate-500 mb-2">Items ({selected.items.length})</p>
                  {selected.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-50">
                      <span>{item.name}</span>
                      <span className="tabular-nums">₹{item.price} × {item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
