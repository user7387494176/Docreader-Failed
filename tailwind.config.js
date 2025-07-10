/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        coral: {
          25: '#fef9f8',
          50: '#fef2f2',
          100: '#fde6e6',
          200: '#fad1d1',
          300: '#f6a5a5',
          400: '#f07979',
          500: '#ff7f7f',
          600: '#e85c5c',
          700: '#c93a3a',
          800: '#a32424',
          900: '#7f1d1d',
        },
        salmon: {
          50: '#fef7f4',
          100: '#fdeee8',
          200: '#fdddd0',
          300: '#fab8a0',
          400: '#f6926f',
          500: '#fa8072',
          600: '#e55a47',
          700: '#c23d2a',
          800: '#9f2a1a',
          900: '#7c1e11',
        },
        orange: {
          25: '#fffcf7',
          50: '#fffbf5',
          100: '#fef3e2',
          200: '#fde4c7',
          300: '#fbc8a0',
          400: '#f8a572',
          500: '#ffb347',
          600: '#e6842d',
          700: '#c26625',
          800: '#9d4f20',
          900: '#7c3e1b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};