/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F1F5FA',
          100: '#DCE7F5',
          700: '#173B66',
          800: '#102A4C',
          900: '#0B1F3A',
          950: '#071527',
        },
        teal: {
          50: '#E6FAF7',
          100: '#CCFBF1',
          200: '#99F6E4',
          500: '#0FB5A6',
          600: '#0C9A8D',
          700: '#0A7C72',
        },
        mist: '#F5F8FC',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,31,58,.06), 0 8px 24px -12px rgba(11,31,58,.18)',
        lift: '0 12px 32px -16px rgba(11,31,58,.28)',
      },
      borderRadius: {
        xl: '1.25rem',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
        'fade-in': 'fade-in .18s ease-out both',
      },
    },
  },
  plugins: [],
};
