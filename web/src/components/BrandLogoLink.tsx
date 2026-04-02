import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

type BrandLogoLinkProps = {
  logoClassName?: string;
  className?: string;
  variant?: 'default' | 'light';
};

export default function BrandLogoLink({ logoClassName = 'h-10 w-auto', className = 'inline-flex items-center', variant = 'default' }: BrandLogoLinkProps) {
  return (
    <Link href="/" aria-label="Go to home" className={className}>
      <BrandLogo className={logoClassName} variant={variant} />
    </Link>
  );
}
