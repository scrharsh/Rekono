type IconProps = {
  d: string;
  className?: string;
  strokeWidth?: number;
};

export default function Icon({ d, className = 'w-5 h-5', strokeWidth = 1.75 }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}
