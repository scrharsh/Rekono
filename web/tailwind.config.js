/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Obsidian Architect — Surface System
        surface: {
          DEFAULT: '#0b1326',
          low:    '#131b2e',
          container: '#171f33',
          high:   '#222a3d',
          highest: '#2d3449',
        },
        // Primary (Indigo Intelligence)
        primary: {
          DEFAULT: '#c3c0ff',
          container: '#4f46e5',
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Secondary
        secondary: {
          container: '#3131c0',
        },
        // Tertiary
        tertiary: '#bdc2ff',
        // On-surface text
        'on-surface': {
          DEFAULT: '#dae2fd',
          variant: '#c7c4d8',
        },
        // Outline
        'outline-variant': '#464555',
        // Semantic
        success: { DEFAULT: '#4ade80', dim: '#166534' },
        warning: { DEFAULT: '#fbbf24', dim: '#92400e' },
        danger:  { DEFAULT: '#ffb4ab', dim: '#93000a' },
        info:    { DEFAULT: '#60a5fa', dim: '#1e40af' },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(79, 70, 229, 0.15)',
        'glow-md': '0 0 20px rgba(79, 70, 229, 0.2)',
        'glow-lg': '0 0 40px rgba(79, 70, 229, 0.25)',
        'card':    '0 2px 8px rgba(0, 0, 0, 0.25)',
        'card-md': '0 4px 16px rgba(0, 0, 0, 0.3)',
        'card-lg': '0 8px 30px rgba(0, 0, 0, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'slide-right': 'slideRight 0.25s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideRight: { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
};
