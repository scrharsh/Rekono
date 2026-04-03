'use client';

import { useEffect, useState } from 'react';
import { useAuth, API_URL } from '@/contexts/AuthContext';
import Icon from '@/components/Icon';

type SubscriptionState = {
  plan: 'free_ca' | 'business_monthly' | 'business_yearly';
  status: 'active' | 'inactive' | 'cancelled';
  required: boolean;
  activatedAt?: string;
  expiresAt?: string;
};

export default function SubscribePage() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/v1/auth/subscription`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const nextSubscription = await response.json();
        setSubscription(nextSubscription);

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as Record<string, unknown>;
          localStorage.setItem('user', JSON.stringify({ ...parsedUser, subscription: nextSubscription }));
        }
      } catch {
        // Non-blocking: user can still attempt activation.
      }
    };

    fetchSubscription();
  }, [token]);

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

      if (data?.alreadyActive) {
        setError('Your subscription is already active. If you want to upgrade or extend, please contact support.');
        return;
      }

      throw new Error('Razorpay payment link missing in response');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to start Razorpay checkout';
      if (message.toLowerCase().includes('razorpay') && message.toLowerCase().includes('not configured')) {
        setError('Payments are not enabled in this environment yet. Please contact your admin to configure Razorpay keys.');
      } else {
        setError(message);
      }
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

      const latestSubscription = await response.json();
      setSubscription(latestSubscription);

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as Record<string, unknown>;
        localStorage.setItem('user', JSON.stringify({ ...parsedUser, subscription: latestSubscription }));
      }

      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to verify subscription status');
    } finally {
      setLoading(false);
    }
  };

  const isActive = subscription?.status === 'active';
  const hasExpiry = Boolean(subscription?.expiresAt);
  const expiryText = hasExpiry
    ? new Date(String(subscription?.expiresAt)).toLocaleDateString()
    : null;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscription & Billing</h1>
          <p className="page-subtitle">Manage your business plan and payment method</p>
        </div>
      </div>

      {/* Status Card */}
      <div className="rounded-xl border border-[#d7e1ee] bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-[#0b57d0] mb-2">Current Plan</p>
            <h2 className="text-2xl font-bold text-[#102135]">
              {subscription?.plan === 'business_monthly' ? 'Business Monthly' : subscription?.plan === 'business_yearly' ? 'Business Yearly' : 'Free CA'}
            </h2>
          </div>
          <div className={`rounded-lg px-3 py-1 text-xs font-semibold ${
            isActive
              ? 'bg-[#d4edda] text-[#155724]'
              : 'bg-[#f8d7da] text-[#721c24]'
          }`}>
            {isActive ? '✓ Active' : '⚠ Inactive'}
          </div>
        </div>

        <div className="space-y-3 text-sm text-[#5f6b7d]">
          {subscription?.activatedAt && (
            <div className="flex items-center gap-2">
              <Icon d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4" />
              <span>Activated: {new Date(String(subscription.activatedAt)).toLocaleDateString()}</span>
            </div>
          )}
          {expiryText && (
            <div className="flex items-center gap-2">
              <Icon d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4" />
              <span>Expires: {expiryText}</span>
            </div>
          )}
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Features */}
        <div className="rounded-xl border border-[#d7e1ee] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[#102135] mb-4">Included in Your Plan</p>
          <ul className="space-y-3 text-sm text-[#5f6b7d]">
            <li className="flex items-center gap-2">
              <Icon d="M5 13l4 4L19 7" className="w-4 h-4 text-[#0b57d0]" />
              Exception-first reconciliation workflows
            </li>
            <li className="flex items-center gap-2">
              <Icon d="M5 13l4 4L19 7" className="w-4 h-4 text-[#0b57d0]" />
              Sales, catalog, and payment operations
            </li>
            <li className="flex items-center gap-2">
              <Icon d="M5 13l4 4L19 7" className="w-4 h-4 text-[#0b57d0]" />
              Sync across web, mobile, and desktop apps
            </li>
            <li className="flex items-center gap-2">
              <Icon d="M5 13l4 4L19 7" className="w-4 h-4 text-[#0b57d0]" />
              Role-based access and team management
            </li>
          </ul>
        </div>

        {/* Management Actions */}
        <div className="rounded-xl border border-[#d7e1ee] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[#102135] mb-4">Plan Actions</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={activateSubscription}
              disabled={loading}
              className="w-full rounded-lg bg-[#0b57d0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0846ab] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Processing...' : isActive ? 'Upgrade or Renew Plan' : 'Activate Paid Plan'}
            </button>
            <button
              type="button"
              onClick={recheckSubscription}
              disabled={loading}
              className="w-full rounded-lg border border-[#d7e1ee] px-4 py-2.5 text-sm font-semibold text-[#102135] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error ? (
        <div className="rounded-lg border border-[#f5c2be] bg-[#fff1f0] px-4 py-3 text-sm text-[#b42318]">
          <div className="flex items-start gap-2">
            <Icon d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        </div>
      ) : null}

      {/* FAQ Section */}
      <div className="rounded-xl border border-[#d7e1ee] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-[#102135] mb-4">Billing Questions?</p>
        <div className="space-y-4 text-sm text-[#5f6b7d]">
          <div>
            <p className="font-medium text-[#102135] mb-1">Can I change my plan anytime?</p>
            <p>Yes. Upgrade, downgrade, or extend your plan at any time. Changes take effect based on your billing cycle.</p>
          </div>
          <div>
            <p className="font-medium text-[#102135] mb-1">What happens when my trial ends?</p>
            <p>You&apos;ll receive email reminders before expiry. Your workspace will be locked until you activate a paid plan, but your data is safely stored.</p>
          </div>
          <div>
            <p className="font-medium text-[#102135] mb-1">Is payment secure?</p>
            <p>All payments are processed via Razorpay with industry-standard encryption. We never store your card details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
