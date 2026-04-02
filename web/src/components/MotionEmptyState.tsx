'use client';

import { ReactNode } from 'react';

type MotionEmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export default function MotionEmptyState({ title, description, action }: MotionEmptyStateProps) {
  return (
    <div className="empty-state enterprise-empty-state">
      <div className="motion-orb" aria-hidden="true">
        <lottie-player
          src="https://assets8.lottiefiles.com/packages/lf20_zrqthn6o.json"
          background="transparent"
          speed="1"
          style={{ width: '78px', height: '78px' }}
          loop
          autoplay
        />
      </div>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-desc">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
