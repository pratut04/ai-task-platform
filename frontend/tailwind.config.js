/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6fe',
          300: '#a4bbfc',
          400: '#7c96f8',
          500: '#5b70f0',
          600: '#4550e5',
          700: '#3940ca',
          800: '#3135a2',
          900: '#2d3281',
          950: '#1c1f4d',
        },
        // Accent colors
        accent: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
          950: '#4a044e',
        },
        // Dark theme surface colors
        surface: {
          900: '#0d0f1a',
          800: '#141628',
          700: '#1c1f38',
          600: '#252848',
          500: '#2e3158',
          400: '#3d4175',
        },
        // Status colors
        status: {
          pending: '#f59e0b',
          running: '#3b82f6',
          success: '#10b981',
          failed: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #5b70f0 0%, #d946ef 100%)',
        'gradient-surface': 'linear-gradient(135deg, #141628 0%, #1c1f38 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(91,112,240,0.1) 0%, rgba(217,70,239,0.05) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(91, 112, 240, 0.3)',
        'glow-accent': '0 0 20px rgba(217, 70, 239, 0.3)',
        card: '0 4px 24px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 40px rgba(91, 112, 240, 0.2)',
      },
    },
  },
  plugins: [],
};
