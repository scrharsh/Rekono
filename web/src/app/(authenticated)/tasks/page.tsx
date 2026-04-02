'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MotionEmptyState from '@/components/MotionEmptyState';
import LottieLoader from '@/components/LottieLoader';
import Icon from '@/components/Icon';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function TasksPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');
  const [addForm, setAddForm] = useState({ title: '', description: '', clientId: '', priority: 'medium', dueDate: '' });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['ca-tasks'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/tasks`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['ca-clients-list'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/ca/clients`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch(`${API_URL}/v1/ca/tasks`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ca-tasks'] }); setShowAdd(false); setAddForm({ title: '', description: '', clientId: '', priority: 'medium', dueDate: '' }); },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`${API_URL}/v1/ca/tasks/${id}/status`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ca-tasks'] }),
  });

  const filtered = filter === 'all' ? tasks
    : filter === 'pending' ? tasks.filter((t: any) => t.status === 'pending')
    : filter === 'in_progress' ? tasks.filter((t: any) => t.status === 'in_progress')
    : tasks.filter((t: any) => t.status === 'completed');

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t: any) => t.status === 'pending').length,
    in_progress: tasks.filter((t: any) => t.status === 'in_progress').length,
    completed: tasks.filter((t: any) => t.status === 'completed').length,
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Priority-based task management</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Icon d="M12 4.5v15m7.5-7.5h-15" /> New Task
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-high)' }}>
        {[
          { id: 'all', label: `All (${counts.all})` },
          { id: 'pending', label: `Pending (${counts.pending})` },
          { id: 'in_progress', label: `In Progress (${counts.in_progress})` },
          { id: 'completed', label: `Done (${counts.completed})` },
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

      {/* Add Task Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(12, 26, 43, 0.34)', backdropFilter: 'blur(7px)' }}>
          <div className="w-full max-w-md animate-scale-in rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--outline-variant)', boxShadow: '0 20px 64px rgba(15, 32, 56, 0.16)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--on-surface)' }}>Create Task</h2>
            <form onSubmit={e => { e.preventDefault(); addMutation.mutate(addForm); }} className="space-y-4">
              <div>
                <label className="input-label">Title *</label>
                <input className="input" value={addForm.title} required
                  onChange={e => setAddForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. File GSTR-1 for Sharma" />
              </div>
              <div>
                <label className="input-label">Description</label>
                <input className="input" value={addForm.description}
                  onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Details..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Client</label>
                  <select className="input" value={addForm.clientId}
                    onChange={e => setAddForm(p => ({ ...p, clientId: e.target.value }))}>
                    <option value="">General task</option>
                    {clients.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Priority</label>
                  <select className="input" value={addForm.priority}
                    onChange={e => setAddForm(p => ({ ...p, priority: e.target.value }))}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="input-label">Due Date</label>
                <input className="input" type="date" value={addForm.dueDate}
                  onChange={e => setAddForm(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={addMutation.isPending || !addForm.title} className="btn-primary">
                  {addMutation.isPending ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task list */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LottieLoader label="Loading tasks..." size={44} />
        </div>
      ) : filtered.length === 0 ? (
        <MotionEmptyState
          title="No tasks found"
          description={filter === 'all' ? 'Create your first task and start execution flow.' : 'No tasks in this category yet.'}
        />
      ) : (
        <div className="space-y-2 stagger-children">
          {filtered.map((task: any) => {
            const priorityClass = task.priority === 'high' ? 'focus-card-urgent' : task.priority === 'medium' ? 'focus-card-warning' : 'focus-card-normal';
            return (
              <div key={task._id} className={`focus-card ${priorityClass}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox */}
                    <button
                      onClick={() => updateStatusMutation.mutate({
                        id: task._id,
                        status: task.status === 'completed' ? 'pending' : task.status === 'pending' ? 'in_progress' : 'completed',
                      })}
                      className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all"
                      style={{
                        borderColor: task.status === 'completed' ? 'var(--success)' : 'var(--outline-variant)',
                        background: task.status === 'completed' ? 'var(--success)' : 'transparent',
                      }}>
                      {task.status === 'completed' && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1">
                      <p className="font-medium text-sm" style={{
                        color: 'var(--on-surface)',
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        opacity: task.status === 'completed' ? 0.5 : 1,
                      }}>{task.title}</p>
                      {task.description && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        {task.clientId && (
                          <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                            {clients.find((c: any) => c._id === (task.clientId?._id || task.clientId))?.name || ''}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="text-xs tabular-nums" style={{ color: 'var(--on-surface-variant)' }}>
                            Due: {new Date(task.dueDate).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`badge-${task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'yellow' : 'gray'}`}>
                      {task.priority}
                    </span>
                    <span className={`badge-${task.status === 'completed' ? 'green' : task.status === 'in_progress' ? 'blue' : 'gray'}`}>
                      {task.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
