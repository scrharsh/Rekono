'use client';

type LottieLoaderProps = {
  label?: string;
  size?: number;
};

export default function LottieLoader({ label = 'Loading workspace...', size = 42 }: LottieLoaderProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ background: 'var(--surface-high)', border: '1px solid var(--outline-variant)' }}>
      <lottie-player
        src="https://assets7.lottiefiles.com/packages/lf20_usmfx6bp.json"
        background="transparent"
        speed="1"
        style={{ width: `${size}px`, height: `${size}px` }}
        loop
        autoplay
      />
      <span className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>{label}</span>
    </div>
  );
}
