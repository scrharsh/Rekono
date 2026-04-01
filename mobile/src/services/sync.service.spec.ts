import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPendingSyncItems,
  getPaymentById,
  getSaleById,
  markAsSynced,
} from './database.service';
import { syncWithServer } from './sync.service';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
  },
}));

jest.mock('./database.service', () => ({
  getPendingSyncItems: jest.fn(),
  markAsSynced: jest.fn(),
  getSaleById: jest.fn(),
  getPaymentById: jest.fn(),
}));

describe('syncWithServer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn();
  });

  it('returns early when token is missing', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    await syncWithServer();

    expect(getPendingSyncItems).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('marks match as synced when backend returns 409 (already matched)', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token-123');
    (getPendingSyncItems as jest.Mock).mockResolvedValue({
      sales: [],
      payments: [],
      matches: [{ id: 'match-1', saleId: 'sale-1', paymentId: 'payment-1', notes: 'local link' }],
    });

    (getSaleById as jest.Mock).mockResolvedValue({
      id: 'sale-1',
      showroomId: 'showroom-1',
      totalAmount: 1000,
      timestamp: '2026-04-01T10:00:00.000Z',
    });

    (getPaymentById as jest.Mock).mockResolvedValue({
      id: 'payment-1',
      showroomId: 'showroom-1',
      amount: 1000,
      timestamp: '2026-04-01T10:01:00.000Z',
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sales: [{ _id: 'remote-sale-1', totalAmount: 1000, timestamp: '2026-04-01T10:00:00.000Z' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ payments: [{ _id: 'remote-payment-1', amount: 1000, timestamp: '2026-04-01T10:01:00.000Z' }] }),
      })
      .mockResolvedValueOnce({ ok: false, status: 409 });

    await syncWithServer();

    expect(markAsSynced).toHaveBeenCalledWith('matches', 'match-1');
  });
});
