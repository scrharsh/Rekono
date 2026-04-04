import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';

export type BusinessMode = 'retail' | 'wholesale' | 'services' | 'agency' | 'workshop' | 'mixed';

export type CatalogItem = {
  _id: string;
  name?: string;
  category: string;
  type?: string;
  sellingPrice: number;
  gstRate?: number;
  isFavorite?: boolean;
  usageCount?: number;
};

export async function upsertBusinessProfile(payload: { name: string; businessMode: BusinessMode }) {
  const token = await AsyncStorage.getItem('token');
  if (!token) return null;

  const res = await fetch(`${API_URL}/business-profiles/me`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to save business profile');
  }

  return res.json();
}

export async function refreshAccessToken(): Promise<string | null> {
  const token = await AsyncStorage.getItem('token');
  if (!token) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: token }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (data?.access_token) {
    await AsyncStorage.setItem('token', data.access_token);
    return data.access_token;
  }

  return null;
}

export async function fetchCurrentUser(): Promise<{ showroomIds?: string[] } | null> {
  const token = await AsyncStorage.getItem('token');
  if (!token) return null;

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data || null;
}

export async function fetchBusinessContext(): Promise<{
  businessProfileId?: string;
  showroomId?: string;
  businessMode?: string;
  businessName?: string;
} | null> {
  const token = await AsyncStorage.getItem('token');
  if (!token) return null;

  const res = await fetch(`${API_URL}/business-profiles/me/context`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  return res.json();
}

export async function hydrateBusinessContextFromServer(): Promise<{
  businessProfileId?: string;
  showroomId?: string;
  businessMode?: string;
  businessName?: string;
} | null> {
  const context = await fetchBusinessContext();
  if (!context) return null;

  if (context.showroomId) {
    await AsyncStorage.setItem('showroomId', context.showroomId);
  }
  if (context.businessProfileId) {
    await AsyncStorage.setItem('businessProfileId', context.businessProfileId);
  }
  if (context.businessMode) {
    await AsyncStorage.setItem('businessMode', context.businessMode);
  }
  if (context.businessName) {
    await AsyncStorage.setItem('showroomName', context.businessName);
  }

  return context;
}

export async function fetchCatalogItems(businessId: string): Promise<CatalogItem[]> {
  const token = await AsyncStorage.getItem('token');
  if (!token || !businessId) return [];

  const res = await fetch(`${API_URL}/catalog/${businessId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch catalog');
  }

  const payload = await res.json();

  if (Array.isArray(payload)) {
    return payload as CatalogItem[];
  }

  if (Array.isArray(payload?.items)) {
    return payload.items as CatalogItem[];
  }

  if (Array.isArray(payload?.data)) {
    return payload.data as CatalogItem[];
  }

  return [];
}

export async function createCatalogItem(
  businessId: string,
  payload: { name: string; category: string; type?: string; sellingPrice: number; gstRate?: number },
): Promise<CatalogItem> {
  const token = await AsyncStorage.getItem('token');
  if (!token || !businessId) {
    throw new Error('Missing session or business profile');
  }

  const res = await fetch(`${API_URL}/catalog/${businessId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to create catalog item');
  }

  return res.json();
}

export async function toggleCatalogFavorite(businessId: string, itemId: string): Promise<CatalogItem> {
  const token = await AsyncStorage.getItem('token');
  if (!token || !businessId || !itemId) {
    throw new Error('Missing session or item details');
  }

  const res = await fetch(`${API_URL}/catalog/${businessId}/${itemId}/favorite`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to update favorite status');
  }

  return res.json();
}

export async function deleteCatalogItem(businessId: string, itemId: string): Promise<void> {
  const token = await AsyncStorage.getItem('token');
  if (!token || !businessId || !itemId) {
    throw new Error('Missing session or item details');
  }

  const res = await fetch(`${API_URL}/catalog/${businessId}/${itemId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to delete catalog item');
  }
}
