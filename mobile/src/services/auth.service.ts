import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:3000/v1';

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
