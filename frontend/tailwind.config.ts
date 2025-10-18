import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#7f5af0',
          50: '#f4f1ff',
          100: '#e3dcff',
          200: '#c1b7ff',
          300: '#9f92ff',
          400: '#7e6cff',
          500: '#6248f2',
          600: '#4d38c1',
          700: '#382990',
          800: '#231a5f',
          900: '#130d3c',
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(95, 71, 226, 0.45)',
      },
    },
  },
  plugins: [],
} satisfies Config
