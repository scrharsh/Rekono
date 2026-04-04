'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_URL } from '@/lib/api';

interface User {
  id: string;
  username: string;
  role: 'staff' | 'accountant' | 'ca' | 'admin';
  showroomIds: string[];
  subscription?: {
    plan: 'free_ca' | 'business_monthly' | 'business_yearly';
    status: 'active' | 'inactive' | 'cancelled';
    required: boolean;
    activatedAt?: string;
    expiresAt?: string;
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hasActiveSubscription: boolean;
  isReady: boolean;
  businessShowroomId: string | null;
  isBusinessWorkspaceReady: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { API_URL };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [businessShowroomId, setBusinessShowroomId] = useState<string | null>(null);
  const [isBusinessWorkspaceReady, setIsBusinessWorkspaceReady] = useState(false);

  const resolveBusinessShowroomId = async (currentUser: User, authToken: string) => {
    if (currentUser.role !== 'staff') {
      setBusinessShowroomId(null);
      setIsBusinessWorkspaceReady(true);
      return;
    }

    setIsBusinessWorkspaceReady(false);

    const authHeaders = { Authorization: `Bearer ${authToken}` };

    try {
      const profileResponse = await fetch(`${API_URL}/v1/business-profiles/me/context`, {
        headers: authHeaders,
      });

      if (profileResponse.ok) {
        const profileContext = await profileResponse.json();
        setBusinessShowroomId(profileContext.showroomId ?? null);
        setIsBusinessWorkspaceReady(true);
        return;
      }

      if (profileResponse.status !== 404) {
        setBusinessShowroomId(null);
        setIsBusinessWorkspaceReady(true);
        return;
      }

      const bootstrapResponse = await fetch(`${API_URL}/v1/business-profiles/me`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentUser.username,
          businessMode: 'mixed',
        }),
      });

      if (bootstrapResponse.ok) {
        const profileContext = await bootstrapResponse.json();
        setBusinessShowroomId(profileContext.showroomId ?? null);

        const refreshedUserResponse = await fetch(`${API_URL}/v1/auth/me`, {
          headers: authHeaders,
        });

        if (refreshedUserResponse.ok) {
          const refreshedUser = await refreshedUserResponse.json();
          localStorage.setItem('user', JSON.stringify(refreshedUser));
          setUser(refreshedUser);
        }
      }

      setIsBusinessWorkspaceReady(true);
    } catch {
      setBusinessShowroomId(null);
      setIsBusinessWorkspaceReady(true);
    }
  };

  const hasActiveSubscription =
    !user?.subscription?.required || user.subscription?.status === 'active';

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    const hydrateUser = async () => {
      if (!storedToken) {
        setIsReady(true);
        return;
      }

      setToken(storedToken);

      try {
        const response = await fetch(`${API_URL}/v1/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (response.ok) {
          const currentUser = await response.json();
          localStorage.setItem('user', JSON.stringify(currentUser));
          setUser(currentUser);
          setIsAuthenticated(true);

          await resolveBusinessShowroomId(currentUser, storedToken);

          setIsReady(true);
          return;
        }
      } catch {
        // Fall back to the cached user below.
      }

      if (storedUser) {
        try {
          const currentUser = JSON.parse(storedUser);
          setUser(currentUser);
          setIsAuthenticated(true);

          await resolveBusinessShowroomId(currentUser, storedToken);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      setIsReady(true);
    }

    void hydrateUser();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    const response = await fetch(`${API_URL}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Login failed');
    }

    const data = await response.json();
    const accessToken = data.access_token || data.token;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(accessToken);
    setUser(data.user);
    setIsAuthenticated(true);

    await resolveBusinessShowroomId(data.user, accessToken);

    return data.user as User;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setBusinessShowroomId(null);
    setIsBusinessWorkspaceReady(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        hasActiveSubscription,
        isReady,
        businessShowroomId,
        isBusinessWorkspaceReady,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
