/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        glass: {
          DEFAULT: 'rgba(255,255,255,0.05)',
          hover:   'rgba(255,255,255,0.08)',
          border:  'rgba(255,255,255,0.08)',
        },
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      backdropBlur: { xs: '2px' },
      animation: {
        'fadeInUp':    'fadeInUp 0.5s ease forwards',
        'fadeIn':      'fadeIn 0.3s ease forwards',
        'pulse-slow':  'pulse 3s ease infinite',
        'spin-slow':   'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
