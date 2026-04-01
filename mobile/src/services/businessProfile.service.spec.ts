import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchBusinessContext,
  hydrateBusinessContextFromServer,
} from './businessProfile.service';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

describe('businessProfile.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn();
  });

  it('returns null context when token missing', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const result = await fetchBusinessContext();

    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('hydrates context keys into storage when server context is available', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token-123');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        showroomId: 'showroom-1',
        businessProfileId: 'profile-1',
        businessMode: 'retail',
        businessName: 'Acme Retail',
      }),
    });

    const result = await hydrateBusinessContextFromServer();

    expect(result).toEqual({
      showroomId: 'showroom-1',
      businessProfileId: 'profile-1',
      businessMode: 'retail',
      businessName: 'Acme Retail',
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('showroomId', 'showroom-1');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('businessProfileId', 'profile-1');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('businessMode', 'retail');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('showroomName', 'Acme Retail');
  });
});
