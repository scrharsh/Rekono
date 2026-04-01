import AsyncStorage from '@react-native-async-storage/async-storage';
import { hydrateBusinessContextFromServer } from './businessProfile.service';
import { syncWithServer } from './sync.service';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

jest.mock('./database.service', () => ({
  getPendingSyncItems: jest.fn(),
  markAsSynced: jest.fn(),
  getSaleById: jest.fn(),
  getPaymentById: jest.fn(),
}));

const db = jest.requireMock('./database.service');

describe('Platform flow integration (service-level)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn();
  });

  it('runs onboarding context hydration then capture-sync-match flow', async () => {
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce('token-ctx')
      .mockResolvedValueOnce('token-sync');

    (global.fetch as jest.Mock)
      // business context
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          businessProfileId: 'profile-1',
          showroomId: 'showroom-1',
          businessMode: 'retail',
          businessName: 'Acme Retail',
        }),
      })
      // sale upload
      .mockResolvedValueOnce({ ok: true, status: 201 })
      // payment upload
      .mockResolvedValueOnce({ ok: true, status: 201 })
      // remote sales lookup for match sync
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sales: [{ _id: 'rs1', totalAmount: 1000, timestamp: '2026-04-02T10:00:00.000Z' }] }),
      })
      // remote payments lookup for match sync
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ payments: [{ _id: 'rp1', amount: 1000, timestamp: '2026-04-02T10:01:00.000Z' }] }),
      })
      // match upload
      .mockResolvedValueOnce({ ok: true, status: 201 });

    db.getPendingSyncItems.mockResolvedValue({
      sales: [{ id: 'ls1', showroomId: 'showroom-1', totalAmount: 1000, taxableAmount: 1000, cgst: 0, sgst: 0, igst: 0, items: [], timestamp: '2026-04-02T10:00:00.000Z' }],
      payments: [{ id: 'lp1', showroomId: 'showroom-1', amount: 1000, paymentMethod: 'cash', source: 'manual', timestamp: '2026-04-02T10:01:00.000Z' }],
      matches: [{ id: 'lm1', saleId: 'ls1', paymentId: 'lp1' }],
    });

    db.getSaleById.mockResolvedValue({
      id: 'ls1', showroomId: 'showroom-1', totalAmount: 1000, timestamp: '2026-04-02T10:00:00.000Z',
    });
    db.getPaymentById.mockResolvedValue({
      id: 'lp1', showroomId: 'showroom-1', amount: 1000, timestamp: '2026-04-02T10:01:00.000Z',
    });

    await hydrateBusinessContextFromServer();
    await syncWithServer();

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('showroomId', 'showroom-1');
    expect(db.markAsSynced).toHaveBeenCalledWith('sales', 'ls1');
    expect(db.markAsSynced).toHaveBeenCalledWith('payments', 'lp1');
    expect(db.markAsSynced).toHaveBeenCalledWith('matches', 'lm1');
  });
});
