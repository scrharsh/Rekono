import { useId } from 'react';

type BrandMarkProps = {
  className?: string;
};

export default function BrandMark({ className = 'w-9 h-9' }: BrandMarkProps) {
  const id = useId().replace(/:/g, '');
  const layer1Id = `${id}-layer1`;
  const layer2Id = `${id}-layer2`;
  const layer3Id = `${id}-layer3`;

  return (
    <svg className={className} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rekono brand mark">
      <defs>
        <linearGradient id={layer1Id} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#063580" />
          <stop offset="100%" stopColor="#0E7EF0" />
        </linearGradient>
        <linearGradient id={layer2Id} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0B57D0" />
          <stop offset="100%" stopColor="#2D8DFB" />
        </linearGradient>
        <linearGradient id={layer3Id} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0E7EF0" />
          <stop offset="100%" stopColor="#60AFFF" />
        </linearGradient>
      </defs>
      <path d="M 125 35 L 185 35 C 190 35 195 38 192 45 L 85 210 C 82 215 75 215 72 210 Z" fill={`url(#${layer1Id})`} />
      <path d="M 95 35 L 155 35 C 160 35 165 38 162 45 L 55 210 C 52 215 45 215 42 210 Z" fill={`url(#${layer2Id})`} />
      <path d="M 65 35 L 125 35 C 130 35 135 38 132 45 L 25 210 C 22 215 15 215 12 210 Z" fill={`url(#${layer3Id})`} />
    </svg>
  );
}
