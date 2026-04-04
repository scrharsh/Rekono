'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/Icon';
import MotionEmptyState from '@/components/MotionEmptyState';
import { API_URL } from '@/lib/api';

type CatalogItem = {
  _id: string;
  name?: string;
  category: string;
  type?: string;
  sellingPrice?: number;
  gstRate?: number;
  isFavorite?: boolean;
  usageCount?: number;
  attributes?: {
    brand?: string;
    model?: string;
    series?: string;
    hsnCode?: string;
    unit?: string;
    serialNumber?: string;
  };
};

function authHeaders(token?: string | null) {
  return { Authorization: `Bearer ${token || localStorage.getItem('token')}` };
}

export default function ItemsPage() {
  const { token, businessShowroomId, isBusinessWorkspaceReady } = useAuth();
  const businessId = businessShowroomId ?? '';

  const [query, setQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    category: 'Products',
    type: '',
    serialNumber: '',
    brand: '',
    model: '',
    unit: 'pcs',
    gstRate: '',
    sellingPrice: '',
  });

  const { data: items = [], refetch, isLoading } = useQuery<CatalogItem[]>({
    queryKey: ['catalog-items', businessId],
    enabled: Boolean(businessId && token),
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/catalog/${businessId}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error('Failed to load items');
      return res.json();
    },
  });

  useEffect(() => {
    if (!showAddForm) {
      setError(null);
    }
  }, [showAddForm]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;

    return items.filter((item) => {
      const haystack = [
        item.name,
        item.category,
        item.type,
        item.attributes?.brand,
        item.attributes?.model,
        item.attributes?.series,
        item.attributes?.serialNumber,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [items, query]);

  const handleCreate = async () => {
    if (!businessId) {
      setError('Business workspace is still resolving.');
      return;
    }

    const sellingPrice = Number(form.sellingPrice);
    const gstRate = form.gstRate ? Number(form.gstRate) : undefined;

    if (!form.name.trim() || !form.category.trim() || Number.isNaN(sellingPrice) || sellingPrice < 0) {
      setError('Name, category, and a valid price are required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/v1/catalog/${businessId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(token),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category.trim(),
          type: form.type.trim() || undefined,
          sellingPrice,
          gstRate,
          attributes: {
            brand: form.brand.trim() || undefined,
            model: form.model.trim() || undefined,
            unit: form.unit.trim() || undefined,
            serialNumber: form.serialNumber.trim() || undefined,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Unable to save item');
      }

      setForm({
        name: '',
        category: 'Products',
        type: '',
        serialNumber: '',
        brand: '',
        model: '',
        unit: 'pcs',
        gstRate: '',
        sellingPrice: '',
      });
      setShowAddForm(false);
      await refetch();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (editingItemId) {
      const sellingPrice = Number(form.sellingPrice);
      const gstRate = form.gstRate ? Number(form.gstRate) : undefined;

      if (!form.name.trim() || !form.category.trim() || Number.isNaN(sellingPrice) || sellingPrice < 0) {
        setError('Name, category, and a valid price are required.');
        return;
      }

      setSaving(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/v1/catalog/${businessId}/${editingItemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(token),
          },
          body: JSON.stringify({
            name: form.name.trim(),
            category: form.category.trim(),
            type: form.type.trim() || undefined,
            sellingPrice,
            gstRate,
            attributes: {
              brand: form.brand.trim() || undefined,
              model: form.model.trim() || undefined,
              unit: form.unit.trim() || undefined,
              serialNumber: form.serialNumber.trim() || undefined,
            },
          }),
        });

        if (!res.ok) {
          throw new Error('Unable to update item');
        }

        setEditingItemId(null);
        setShowAddForm(false);
        await refetch();
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : 'Unable to update item');
      } finally {
        setSaving(false);
      }

      return;
    }

    await handleCreate();
  };

  const openAddForm = () => {
    setEditingItemId(null);
    setForm({
      name: '',
      category: 'Products',
      type: '',
      serialNumber: '',
      brand: '',
      model: '',
      unit: 'pcs',
      gstRate: '',
      sellingPrice: '',
    });
    setError(null);
    setShowAddForm(true);
  };

  const openEditForm = (item: CatalogItem) => {
    setEditingItemId(item._id);
    setForm({
      name: item.name ?? '',
      category: item.category ?? 'Products',
      type: item.type ?? '',
      serialNumber: item.attributes?.serialNumber ?? '',
      brand: item.attributes?.brand ?? '',
      model: item.attributes?.model ?? '',
      unit: item.attributes?.unit ?? 'pcs',
      gstRate: item.gstRate?.toString() ?? '',
      sellingPrice: item.sellingPrice?.toString() ?? '',
    });
    setError(null);
    setShowAddForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!businessId) return;
    const confirmed = window.confirm('Delete this item from your business list?');
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_URL}/v1/catalog/${businessId}/${itemId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });

      if (!res.ok) {
        throw new Error('Unable to delete item');
      }

      if (editingItemId === itemId) {
        setEditingItemId(null);
        setShowAddForm(false);
      }
      await refetch();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete item');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">Business OS</p>
          <h1 className="page-title">Items</h1>
          <p className="page-subtitle">Add products, services, serial numbers, and pricing to your business list</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/business-dashboard" className="btn-secondary">Dashboard</Link>
          <button onClick={openAddForm} className="btn-primary">
            <Icon d="M12 4v16m8-8H4" className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {!isBusinessWorkspaceReady ? (
        <div className="card card-body py-16 text-center">
          <div className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>Resolving your business workspace...</div>
        </div>
      ) : null}

      {showAddForm && isBusinessWorkspaceReady && (
        <div className="card card-body space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="card-title">{editingItemId ? 'Edit Business Item' : 'Add Business Item'}</h2>
              <p className="text-xs text-[#4f71a5] mt-1">Include a serial number when the item is trackable or unique.</p>
            </div>
            <button onClick={() => { setShowAddForm(false); setEditingItemId(null); }} className="btn-ghost btn-sm">Close</button>
          </div>

          {error && <div className="alert-danger text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="input-group">
              <span className="input-label">Item Name</span>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. AC Service Kit" />
            </label>
            <label className="input-group">
              <span className="input-label">Category</span>
              <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Products / Services" />
            </label>
            <label className="input-group">
              <span className="input-label">Type</span>
              <input className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Spare Part" />
            </label>
            <label className="input-group">
              <span className="input-label">Serial Number</span>
              <input className="input" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} placeholder="e.g. SN-2026-001" />
            </label>
            <label className="input-group">
              <span className="input-label">Brand</span>
              <input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Brand name" />
            </label>
            <label className="input-group">
              <span className="input-label">Model</span>
              <input className="input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Model number" />
            </label>
            <label className="input-group">
              <span className="input-label">Unit</span>
              <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs, kg, nos" />
            </label>
            <label className="input-group">
              <span className="input-label">GST Rate</span>
              <input className="input" type="number" min="0" step="0.01" value={form.gstRate} onChange={(e) => setForm({ ...form, gstRate: e.target.value })} placeholder="18" />
            </label>
            <label className="input-group md:col-span-2">
              <span className="input-label">Selling Price</span>
              <input className="input" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} placeholder="0.00" />
            </label>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button onClick={() => { setShowAddForm(false); setEditingItemId(null); }} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? 'Saving...' : editingItemId ? 'Update Item' : 'Save Item'}
            </button>
          </div>
        </div>
      )}

      <div className="card card-body">
        <div className="flex items-center gap-3 justify-between mb-4">
          <div>
            <h2 className="card-title">Your Item List</h2>
            <p className="text-xs text-[#4f71a5] mt-1">Track what your business sells or services, including serial numbers where needed.</p>
          </div>
          <div className="w-full max-w-sm">
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items, serial numbers, brand..."
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--on-surface-variant)' }}>Loading items...</div>
        ) : filteredItems.length === 0 ? (
          <MotionEmptyState
            title="No business items yet"
            description="Add your first product or service so your business list can start tracking serial numbers, pricing, and GST."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div key={item._id} className="rounded-2xl border border-[#dbe7ff] bg-[#f7fbff] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f71a5]">{item.category}</p>
                    <h3 className="mt-1 text-lg font-semibold text-[#153c74]">{item.name ?? 'Unnamed item'}</h3>
                    <p className="text-sm text-[#4f71a5] mt-1">
                      {item.type ?? 'Item'} {item.attributes?.brand ? `• ${item.attributes.brand}` : ''} {item.attributes?.model ? `• ${item.attributes.model}` : ''}
                    </p>
                  </div>
                  {item.isFavorite ? <span className="badge-blue">Favorite</span> : <span className="badge-gray">Saved</span>}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white border border-[#dbe7ff] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#4f71a5]">Serial No.</p>
                    <p className="mt-1 font-mono text-[#153c74]">{item.attributes?.serialNumber ?? '—'}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-[#dbe7ff] p-3">
                    <p className="text-xs uppercase tracking-wide text-[#4f71a5]">Price</p>
                    <p className="mt-1 font-semibold text-[#153c74]">₹{Number(item.sellingPrice ?? 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-[#4f71a5]">
                  <span>GST {item.gstRate ?? 0}%</span>
                  <span>Used {item.usageCount ?? 0} times</span>
                </div>

                <div className="mt-4 flex items-center gap-2 justify-end">
                  <button onClick={() => openEditForm(item)} className="btn-secondary btn-sm">Edit</button>
                  <button onClick={() => handleDelete(item._id)} className="btn-ghost btn-sm text-danger">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}