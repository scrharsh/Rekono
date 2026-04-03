import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type LottiePlayerElement = HTMLElement & {
  src?: string;
  background?: string;
  speed?: string | number;
  autoplay?: boolean;
  loop?: boolean;
};

type LottiePlayerAttributes = {
  src?: string;
  background?: string;
  speed?: string | number;
  autoplay?: boolean;
  loop?: boolean;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lottie-player': DetailedHTMLProps<HTMLAttributes<LottiePlayerElement>, LottiePlayerElement> &
        LottiePlayerAttributes;
    }
  }
}

export {};
