import { useId } from 'react';

type BrandLogoProps = {
  className?: string;
  variant?: 'default' | 'light';
};

export default function BrandLogo({ className = 'h-10 w-auto', variant = 'default' }: BrandLogoProps) {
  const id = useId().replace(/:/g, '');
  const layer1Id = `${id}-layer1`;
  const layer2Id = `${id}-layer2`;
  const layer3Id = `${id}-layer3`;
  const isLight = variant === 'light';
  const textColor = isLight ? '#F3F8FF' : '#143468';

  const layer1Start = isLight ? '#61B0FF' : '#063580';
  const layer1End = isLight ? '#2F8DF2' : '#0E7EF0';
  const layer2Start = isLight ? '#8EC9FF' : '#0B57D0';
  const layer2End = isLight ? '#4AA9FF' : '#2D8DFB';
  const layer3Start = isLight ? '#BFE2FF' : '#0E7EF0';
  const layer3End = isLight ? '#78C7FF' : '#60AFFF';
  const edgeStroke = isLight ? '#0F4AAF' : 'none';
  const edgeStrokeWidth = isLight ? 2 : 0;

  return (
    <svg
      className={className}
      viewBox="0 0 420 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Rekono logo"
      style={{ userSelect: 'none' }}
    >
      <defs>
        <linearGradient id={layer1Id} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={layer1Start} />
          <stop offset="100%" stopColor={layer1End} />
        </linearGradient>
        <linearGradient id={layer2Id} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={layer2Start} />
          <stop offset="100%" stopColor={layer2End} />
        </linearGradient>
        <linearGradient id={layer3Id} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={layer3Start} />
          <stop offset="100%" stopColor={layer3End} />
        </linearGradient>
      </defs>

      <g transform="translate(4, 6) scale(0.38)">
        <path d="M 125 35 L 185 35 C 190 35 195 38 192 45 L 85 210 C 82 215 75 215 72 210 Z" fill={`url(#${layer1Id})`} stroke={edgeStroke} strokeWidth={edgeStrokeWidth} strokeLinejoin="round" />
        <path d="M 95 35 L 155 35 C 160 35 165 38 162 45 L 55 210 C 52 215 45 215 42 210 Z" fill={`url(#${layer2Id})`} stroke={edgeStroke} strokeWidth={edgeStrokeWidth} strokeLinejoin="round" />
        <path d="M 65 35 L 125 35 C 130 35 135 38 132 45 L 25 210 C 22 215 15 215 12 210 Z" fill={`url(#${layer3Id})`} stroke={edgeStroke} strokeWidth={edgeStrokeWidth} strokeLinejoin="round" />
      </g>

      <text
        x="77"
        y="78"
        fill={textColor}
        fontSize="62"
        fontWeight="800"
        letterSpacing="-1.4"
        fontFamily="'Plus Jakarta Sans', 'Inter', 'Segoe UI', sans-serif"
        pointerEvents="none"
      >
        Rekono
      </text>
    </svg>
  );
}
