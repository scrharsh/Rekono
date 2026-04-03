import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearNotificationSeenState,
  getNotificationFeed,
  getUnreadNotificationCount,
  markAllNotificationsSeen,
  markNotificationSeen,
  subscribeToNotificationChanges,
} from './notification.service';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('notification.service', () => {
  const fetchMock = global.fetch as jest.Mock | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'token') return Promise.resolve('token-1');
      return Promise.resolve(null);
    });
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('filters and marks audit logs as notifications', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          _id: '1',
          entityType: 'ca_task',
          action: 'assign',
          createdAt: '2026-04-03T10:00:00.000Z',
          metadata: { title: 'Follow up', assignedToName: 'Asha' },
        },
        {
          _id: '2',
          entityType: 'catalog_item',
          action: 'create',
          createdAt: '2026-04-03T11:00:00.000Z',
        },
      ]),
    }) as any;

    const notifications = await getNotificationFeed(20);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].title).toBe('Task assigned');
    expect(notifications[0].message).toContain('Asha');
  });

  it('counts unread notifications from recent activity', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          _id: '1',
          entityType: 'ca_payment',
          action: 'create',
          createdAt: '2026-04-03T10:00:00.000Z',
          metadata: { amount: 1500 },
        },
      ]),
    }) as any;

    const unread = await getUnreadNotificationCount(10);

    expect(unread).toBe(1);
  });

  it('persists seen notification ids and emits updates', async () => {
    let fired = 0;
    const unsubscribe = subscribeToNotificationChanges(() => {
      fired += 1;
    });

    await markNotificationSeen('notif-1');
    await markAllNotificationsSeen([{ id: 'notif-2' } as any]);
    await clearNotificationSeenState();

    unsubscribe();

    expect(AsyncStorage.setItem).toHaveBeenCalled();
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
    expect(fired).toBeGreaterThanOrEqual(2);
  });

  afterAll(() => {
    global.fetch = fetchMock as any;
  });
});