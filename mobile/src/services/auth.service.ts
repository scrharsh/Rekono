import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';

export type SubscriptionInfo = {
  plan: 'free_ca' | 'business_monthly' | 'business_yearly';
  status: 'active' | 'inactive' | 'cancelled';
  required: boolean;
  activatedAt?: string;
  expiresAt?: string;
};

export type SubscriptionPaymentLink = {
  paymentLinkId: string;
  paymentUrl: string;
  amount: number;
  currency: string;
  status: string;
  plan: 'business_monthly' | 'business_yearly';
  durationDays: number;
};

export type SignupPayload = {
  username: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
};

async function storeAuthSession(data: any) {
  const token = data?.access_token || data?.token;
  if (!token) {
    throw new Error('Authentication token missing');
  }

  await AsyncStorage.setItem('token', token);

  if (data?.user) {
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
  }

  return data;
}

export async function logoutMobile() {
  await AsyncStorage.multiRemove(['token', 'user', 'showroomId', 'showroomName', 'businessMode', 'businessProfileId']);
}

export async function getStoredUser(): Promise<Record<string, unknown> | null> {
  const raw = await AsyncStorage.getItem('user');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function loginMobile(username: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    let message = 'Login failed';
    try {
      const data = await res.json();
      message = data?.error?.message || data?.message || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return storeAuthSession(await res.json());
}

export async function signupMobile(payload: SignupPayload) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: payload.username,
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
      phone: payload.phone || undefined,
      role: 'staff',
    }),
  });

  if (!res.ok) {
    let message = 'Signup failed';
    try {
      const data = await res.json();
      message = data?.error?.message || data?.message || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return storeAuthSession(await res.json());
}

export async function getSubscriptionStatus(): Promise<SubscriptionInfo> {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${API_URL}/auth/subscription`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Unable to fetch subscription status');
  }

  return (await res.json()) as SubscriptionInfo;
}

export async function refreshStoredSubscription(): Promise<SubscriptionInfo> {
  const subscription = await getSubscriptionStatus();
  const rawUser = await AsyncStorage.getItem('user');
  if (rawUser) {
    try {
      const user = JSON.parse(rawUser) as Record<string, unknown>;
      await AsyncStorage.setItem('user', JSON.stringify({ ...user, subscription }));
    } catch {
      // ignore malformed cache
    }
  }
  return subscription;
}

export async function createBusinessSubscriptionPaymentLink(
  plan: 'business_monthly' | 'business_yearly' = 'business_monthly',
  durationDays = 30,
): Promise<SubscriptionPaymentLink> {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${API_URL}/auth/subscription/payment-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ plan, durationDays }),
  });

  if (!res.ok) {
    let message = 'Unable to start Razorpay checkout';
    try {
      const data = await res.json();
      message = data?.error?.message || data?.message || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return (await res.json()) as SubscriptionPaymentLink;
}
