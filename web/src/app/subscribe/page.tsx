'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, API_URL } from '@/contexts/AuthContext';

export default function SubscribePage() {
  const router = useRouter();
  const { isAuthenticated, token, hasActiveSubscription, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (hasActiveSubscription) {
      router.replace('/dashboard');
    }
  }, [hasActiveSubscription, isAuthenticated, router]);

  const activateSubscription = async () => {
    if (!token) return;

    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/v1/auth/subscription/payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: 'business_monthly', durationDays: 30 }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error?.message || data?.message || 'Unable to start Razorpay checkout');
      }

      const data = await response.json();
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      throw new Error('Razorpay payment link missing in response');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to start Razorpay checkout');
    } finally {
      setLoading(false);
    }
  };

  const recheckSubscription = async () => {
    if (!token) return;

    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/v1/auth/subscription`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to fetch subscription status');
      }

      const subscription = await response.json();
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser) as Record<string, unknown>;
        localStorage.setItem('user', JSON.stringify({ ...user, subscription }));
      }

      if (!subscription?.required || subscription?.status === 'active') {
        window.location.href = '/dashboard';
        return;
      }

      setError('Payment not confirmed yet. Complete Razorpay payment and try again.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to verify subscription status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f9ff] px-6 py-12 text-[#102135]">
      <div className="mx-auto max-w-xl rounded-2xl border border-[#d7e1ee] bg-white p-8 shadow-[0_12px_28px_rgba(16,33,53,0.08)]">
        <p className="mb-3 inline-flex rounded-full border border-[#c9dafd] bg-[#e9f0ff] px-3 py-1 text-xs font-semibold text-[#0b57d0]">
          Business Subscription Required
        </p>
        <h1 className="text-3xl font-extrabold">Activate to continue</h1>
        <p className="mt-3 text-sm text-[#5f6b7d]">
          Rekono Business OS requires an active subscription. CA workspace remains free for now.
        </p>

        <div className="mt-6 rounded-xl border border-[#d7e1ee] bg-[#f7f9fc] p-4 text-sm text-[#102135]">
          <p className="font-semibold">Included after activation</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[#5f6b7d]">
            <li>Reconciliation queues and match workflows</li>
            <li>Sales, catalog, and payment operations</li>
            <li>Cross-platform sync on web, mobile, and desktop</li>
          </ul>
        </div>

        <div className="mt-4 rounded-xl border border-[#d7e1ee] bg-[#f7f9fc] p-4 text-sm text-[#5f6b7d]">
          Payment is processed securely via Razorpay. After payment, click "I already paid" to refresh access.
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-[#f5c2be] bg-[#fff1f0] px-3 py-2 text-sm text-[#b42318]">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={activateSubscription}
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-[#0b57d0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0846ab] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Starting Razorpay...' : 'Pay with Razorpay'}
        </button>

        <button
          type="button"
          onClick={recheckSubscription}
          disabled={loading}
          className="mt-3 w-full rounded-xl border border-[#d7e1ee] px-4 py-3 text-sm font-semibold text-[#102135] disabled:cursor-not-allowed disabled:opacity-60"
        >
          I already paid
        </button>

        <button
          type="button"
          onClick={logout}
          className="mt-3 w-full rounded-xl border border-[#d7e1ee] px-4 py-3 text-sm font-semibold text-[#102135]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
