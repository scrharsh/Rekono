import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';

const SEEN_STORAGE_KEY = 'rekono.notification.seenIds';

const INTERESTING_ENTITY_TYPES = new Set(['ca_task', 'ca_payment', 'ca_document', 'ca_service', 'ca_client']);

const INTERESTING_ACTIONS = new Set(['create', 'update', 'delete', 'status_change', 'assign', 'bulk_assign', 'reassign', 'verify']);

export type NotificationSeverity = 'high' | 'medium' | 'low';

export type MobileNotification = {
  id: string;
  title: string;
  message: string;
  entityType: string;
  action: string;
  severity: NotificationSeverity;
  createdAt: string;
  read: boolean;
  actorLabel?: string;
  metadata?: Record<string, any>;
};

type AuditLogEntry = {
  _id?: string;
  id?: string;
  entityType?: string;
  action?: string;
  createdAt?: string;
  metadata?: Record<string, any>;
  userId?: { username?: string; role?: string } | string;
};

type NotificationListener = () => void;

const listeners = new Set<NotificationListener>();

function emitNotificationChange() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // Ignore listener failures so one screen cannot break others.
    }
  }
}

export function subscribeToNotificationChanges(listener: NotificationListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function toStringId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && '_id' in value) {
    return toStringId((value as { _id?: unknown })._id);
  }
  return '';
}

function getEntityLabel(entityType?: string, metadata?: Record<string, any>): string {
  if (metadata?.title) return String(metadata.title);
  switch (entityType) {
    case 'ca_task':
      return 'Task';
    case 'ca_payment':
      return 'Payment';
    case 'ca_document':
      return 'Document';
    case 'ca_service':
      return 'Service';
    case 'ca_client':
      return 'Client';
    default:
      return 'Record';
  }
}

function getSeverity(entityType?: string, action?: string): NotificationSeverity {
  if (entityType === 'ca_payment' || action === 'bulk_assign' || action === 'reassign') return 'high';
  if (action === 'delete' || action === 'status_change' || action === 'verify') return 'medium';
  return 'low';
}

function buildNotification(entry: AuditLogEntry): MobileNotification | null {
  const entityType = String(entry.entityType || '');
  const action = String(entry.action || '');

  if (!INTERESTING_ENTITY_TYPES.has(entityType) || !INTERESTING_ACTIONS.has(action)) {
    return null;
  }

  const metadata = entry.metadata || {};
  const entityLabel = getEntityLabel(entityType, metadata);
  const assigneeLabel = metadata.assignedToName ? String(metadata.assignedToName) : 'your team';

  let title = `${entityLabel} updated`;
  let message = `${entityLabel} activity recorded in Rekono.`;

  if (entityType === 'ca_task' && action === 'assign') {
    title = 'Task assigned';
    message = `${metadata.title || 'A task'} assigned to ${assigneeLabel}.`;
  } else if (entityType === 'ca_task' && action === 'bulk_assign') {
    title = 'Bulk assignment completed';
    message = `${metadata.count || 'Multiple'} tasks assigned to ${assigneeLabel}.`;
  } else if (entityType === 'ca_task' && action === 'status_change') {
    title = 'Task status changed';
    message = `${metadata.title || 'A task'} moved to ${String(metadata.status || 'updated')}.`;
  } else if (entityType === 'ca_task' && action === 'delete') {
    title = 'Task removed';
    message = `${metadata.title || 'A task'} was deleted.`;
  } else if (entityType === 'ca_payment' && action === 'create') {
    title = 'Payment captured';
    message = `${metadata.amount ? `₹${Number(metadata.amount).toLocaleString('en-IN')}` : 'A payment'} was recorded.`;
  } else if (entityType === 'ca_payment' && action === 'verify') {
    title = 'Payment verified';
    message = `${metadata.amount ? `₹${Number(metadata.amount).toLocaleString('en-IN')}` : 'A payment'} was verified.`;
  } else if (entityType === 'ca_document' && action === 'verify') {
    title = 'Document verified';
    message = `${metadata.documentName || 'A document'} is now verified.`;
  } else if (entityType === 'ca_service' && action === 'status_change') {
    title = 'Service period updated';
    message = `${metadata.serviceName || 'A service'} changed to ${String(metadata.status || 'updated')}.`;
  } else if (entityType === 'ca_client' && action === 'update') {
    title = 'Client profile updated';
    message = `${metadata.clientName || 'A client'} details changed.`;
  } else if (action === 'reassign') {
    title = 'Task reassigned';
    message = `${metadata.title || 'A task'} reassigned to ${assigneeLabel}.`;
  }

  return {
    id: toStringId(entry._id || entry.id),
    title,
    message,
    entityType,
    action,
    severity: getSeverity(entityType, action),
    createdAt: String(entry.createdAt || new Date().toISOString()),
    read: false,
    actorLabel: typeof entry.userId === 'object' && entry.userId ? entry.userId.username || entry.userId.role : undefined,
    metadata,
  };
}

async function getSeenIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(SEEN_STORAGE_KEY);
  if (!raw) return new Set();

  try {
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

async function setSeenIds(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(Array.from(ids)));
}

async function fetchAuditFeed(limit = 30): Promise<MobileNotification[]> {
  const token = await AsyncStorage.getItem('token');
  if (!token) return [];

  const response = await fetch(`${API_URL}/audit/recent?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Unable to load notifications');
  }

  const payload = await response.json();
  const entries: AuditLogEntry[] = Array.isArray(payload) ? payload : payload?.items || [];
  const seenIds = await getSeenIds();

  return entries
    .map(buildNotification)
    .filter((item): item is MobileNotification => Boolean(item) && Boolean(item.id))
    .map((item) => ({
      ...item,
      read: seenIds.has(item.id),
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getNotifications(limit = 30): Promise<MobileNotification[]> {
  return fetchAuditFeed(limit);
}

export async function getNotificationFeed(limit = 30): Promise<MobileNotification[]> {
  return getNotifications(limit);
}

export async function getUnreadNotificationCount(limit = 30): Promise<number> {
  const notifications = await fetchAuditFeed(limit);
  return notifications.filter((notification) => !notification.read).length;
}

export async function markNotificationSeen(notificationId: string): Promise<void> {
  if (!notificationId) return;
  const seenIds = await getSeenIds();
  seenIds.add(notificationId);
  await setSeenIds(seenIds);
  emitNotificationChange();
}

export async function markAllNotificationsSeen(notifications: MobileNotification[]): Promise<void> {
  const seenIds = await getSeenIds();
  for (const notification of notifications) {
    if (notification.id) {
      seenIds.add(notification.id);
    }
  }
  await setSeenIds(seenIds);
  emitNotificationChange();
}

export async function clearNotificationSeenState(): Promise<void> {
  await AsyncStorage.removeItem(SEEN_STORAGE_KEY);
  emitNotificationChange();
}
