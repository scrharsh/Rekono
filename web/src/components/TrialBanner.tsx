'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/Icon';

export default function TrialBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if banner was previously dismissed
    const isBannerDismissed = localStorage.getItem('trial_banner_dismissed') === 'true';
    setDismissed(isBannerDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('trial_banner_dismissed', 'true');
  };

  // Only show for business users with active trials
  const isBusinessUser = user?.role === 'staff';
  const subscription = user?.subscription;
  const isTrialActive = subscription?.status === 'active' && subscription?.plan === 'business_monthly';
  const expiresAt = subscription?.expiresAt ? new Date(subscription.expiresAt) : null;
  
  if (!mounted || !isBusinessUser || !isTrialActive || dismissed || !expiresAt) {
    return null;
  }

  // Calculate days left
  const today = new Date();
  const daysLeft = Math.ceil((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const expiryDate = new Intl.DateTimeFormat('en-GB').format(expiresAt);

  // Show warning if less than 7 days left
  const isWarning = daysLeft <= 7;
  const bgColor = isWarning ? 'bg-[#fff3cd]' : 'bg-[#d1ecf1]';
  const textColor = isWarning ? 'text-[#856404]' : 'text-[#0c5460]';
  const borderColor = isWarning ? 'border-[#fdeeba]' : 'border-[#bee5eb]';

  return (
    <div className={`${bgColor} border-b ${borderColor} px-4 py-3 sm:px-6`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon 
            d={isWarning ? "M12 9v2m0 4v2m0 0v2m0-18a9 9 0 110 18 9 9 0 010-18z" : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} 
            className={`h-5 w-5 ${textColor} shrink-0`} 
          />
          <div className={`text-sm font-medium ${textColor}`}>
            {daysLeft <= 0 ? (
              <>
                <div>Your trial has expired.</div>
                <div className="text-xs font-normal opacity-90">Expired on {expiryDate}</div>
              </>
            ) : (
              <>
                <div>
                  Your trial expires in <strong>{daysLeft}</strong> {daysLeft === 1 ? 'day' : 'days'}.
                </div>
                <div className="text-xs font-normal opacity-90">Expires on {expiryDate}</div>
              </>
            )}
            {daysLeft > 0 ? <div>Unlock full features by upgrading your plan.</div> : null}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {daysLeft > 0 && (
            <Link 
              href="/subscribe" 
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                isWarning 
                  ? 'bg-[#856404] text-white hover:bg-[#6d5203]' 
                  : 'bg-[#0c5460] text-white hover:bg-[#053e51]'
              } transition`}
            >
              Upgrade now
            </Link>
          )}
          <button
            onClick={handleDismiss}
            className={`inline-flex rounded-lg p-1 ${textColor} hover:opacity-70 transition`}
            aria-label="Dismiss banner"
          >
            <Icon d="M6 18L18 6M6 6l12 12" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
