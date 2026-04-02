/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Landing Palette — Surface System
        surface: {
          DEFAULT: '#f5f9ff',
          low:    '#f7fbff',
          container: '#ffffff',
          high:   '#edf4ff',
          highest: '#e8f0ff',
        },
        // Primary (Landing Blue)
        primary: {
          DEFAULT: '#0b57d0',
          container: '#0b57d0',
          50:  '#f5f9ff',
          100: '#ebf3ff',
          200: '#dbe7ff',
          300: '#b7d0ff',
          400: '#7fb0ff',
          500: '#4d8aff',
          600: '#0e7ef0',
          700: '#0b57d0',
          800: '#0846ab',
          900: '#143a73',
        },
        // Secondary
        secondary: {
          container: '#0846ab',
        },
        // Tertiary
        tertiary: '#1f4f95',
        // On-surface text
        'on-surface': {
          DEFAULT: '#0f2347',
          variant: '#4f71a5',
        },
        // Outline
        'outline-variant': '#d6e4ff',
        // Semantic
        success: { DEFAULT: '#0d7c5f', dim: '#e7f7f2' },
        warning: { DEFAULT: '#a05e08', dim: '#fff2db' },
        danger:  { DEFAULT: '#d13438', dim: '#fde8e8' },
        info:    { DEFAULT: '#1f6dde', dim: '#eef4ff' },
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
        'glow-sm': '0 0 10px rgba(11, 87, 208, 0.08)',
        'glow-md': '0 0 20px rgba(11, 87, 208, 0.12)',
        'glow-lg': '0 0 40px rgba(11, 87, 208, 0.16)',
        'card':    '0 2px 8px rgba(11, 87, 208, 0.06)',
        'card-md': '0 4px 16px rgba(11, 87, 208, 0.08)',
        'card-lg': '0 8px 30px rgba(11, 87, 208, 0.1)',
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
