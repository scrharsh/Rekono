'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MotionEmptyState from './MotionEmptyState';

interface TimelineEvent {
  id: string;
  type: 'past' | 'current' | 'future';
  title: string;
  description: string;
  date: Date;
  status: 'completed' | 'pending' | 'upcoming';
}

interface TimelineViewProps { showroomId: string; }

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const STATUS_CONFIG = {
  completed: { dot: 'bg-success', badge: 'badge-green',  label: 'Completed' },
  pending:   { dot: 'bg-warning', badge: 'badge-yellow', label: 'Pending'   },
  upcoming:  { dot: 'bg-slate-300', badge: 'badge-gray', label: 'Upcoming'  },
};

export default function TimelineView(props: TimelineViewProps) {
  const [range, setRange] = useState<30 | 90>(30);
  const { token } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!props.showroomId) return;

      const headers = { Authorization: `Bearer ${token}` };
      const now = new Date();
      const past = new Date(now.getTime() - range * 86400000);
      const future = new Date(now.getTime() + range * 86400000);

      try {
        const [tasksRes, alertsRes] = await Promise.all([
          fetch(`${API_URL}/v1/ca-os/tasks?showroomId=${props.showroomId}`, { headers }),
          fetch(`${API_URL}/v1/ca-os/alerts?showroomId=${props.showroomId}`, { headers }),
        ]);

        if (!tasksRes.ok || !alertsRes.ok) return;

        const tasksJson = await tasksRes.json();
        const alertsJson = await alertsRes.json();

        const tasks = (tasksJson?.tasks ?? []) as Array<any>;
        const alerts = (alertsJson?.alerts ?? []) as Array<any>;

        const taskEvents: TimelineEvent[] = tasks.map((t) => {
          const due = t.dueDate ? new Date(t.dueDate) : now;
          const type: TimelineEvent['type'] = due > now ? 'future' : 'current';
          return {
            id: `task-${t.id}`,
            type,
            title: t.title,
            description: t.description,
            date: due,
            status: type === 'future' ? 'upcoming' : 'pending',
          };
        });

        const alertEvents: TimelineEvent[] = alerts.map((a) => {
          const when = now;
          return {
            id: `alert-${a.id}`,
            type: 'current',
            title: a.title,
            description: a.description,
            date: when,
            status: 'pending',
          };
        });

        const merged = [...taskEvents, ...alertEvents]
          .filter((e) => e.date >= past && e.date <= future)
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        setEvents(merged);
      } catch {
        // silent: timeline is non-critical UI
      }
    };

    void run();
  }, [props.showroomId, range, token]);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Timeline</h3>
        <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-0.5">
          {([30, 90] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition ${
                range === r ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="card-body">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200" />

          <div className="space-y-5">
            {events.length === 0 ? (
              <MotionEmptyState
                title="No timeline events"
                description="Check again when tasks or alerts change."
              />
            ) : (
              events.map((event) => {
                const cfg = STATUS_CONFIG[event.status];
                return (
                  <div key={event.id} className="relative pl-9">
                    {/* Dot */}
                    <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full ${cfg.dot} ring-2 ring-white`} />

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{event.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-400 tabular-nums">
                          {event.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                        <span className={`${cfg.badge} mt-1`}>{cfg.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
