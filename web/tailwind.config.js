/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f4f6fa',
          100: '#e5eaf3',
          200: '#c5d0e2',
          300: '#a5b5d1',
          400: '#6582af',
          500: '#264f8d', // Trustworthy, premium corporate blue
          600: '#22477f',
          700: '#1c3b6a',
          800: '#172f54',
          900: '#132644',
        },
        accent: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // Vibrant teal for CTAs and highlights
          600: '#0d9488',
          700: '#0f766e',
        },
        surface: {
          DEFAULT: '#ffffff',
          50:  '#f8fafb', // Cooler, modern off-white
          100: '#f1f4f7', // Elegant blue-gray
          200: '#e2e7ec',
        },
        sidebar: '#0b1627', // Crisp, dark midnight slate
        'sidebar-hover': '#132644',
        success: { DEFAULT: '#10b981', light: '#d1fae5', dark: '#065f46' },
        warning: { DEFAULT: '#f59e0b', light: '#fef3c7', dark: '#92400e' },
        danger:  { DEFAULT: '#ef4444', light: '#fee2e2', dark: '#991b1b' },
        info:    { DEFAULT: '#3b82f6', light: '#dbeafe', dark: '#1e40af' },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        card:  '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
        'card-lg': '0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.07)',
        'inner-sm': 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
