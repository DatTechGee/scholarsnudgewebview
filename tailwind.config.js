module.exports = {
  content: ["./pages/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#eef2ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#6ea2ff', 500: '#2f6df6', 600: '#1e4fd6', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a' },
        secondary: { 50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63' },
        surface: { 50: '#f3f6fb', 100: '#e8edf5', 200: '#d7e3f6', 300: '#b0c4e0', 400: '#7f93af', 500: '#4f6484', 600: '#3a5070', 700: '#2a3d5c', 800: '#10223f', 900: '#0a1628' },
        accent: { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f' },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      fontSize: {
        'heading1': ['28px', { lineHeight: '36px', fontWeight: '800', letterSpacing: '-0.5px' }],
        'heading2': ['24px', { lineHeight: '32px', fontWeight: '700', letterSpacing: '-0.3px' }],
        'heading3': ['20px', { lineHeight: '28px', fontWeight: '700', letterSpacing: '-0.2px' }],
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(15,23,42,0.06), 0 1px 2px -1px rgba(15,23,42,0.06)',
        'card': '0 4px 8px rgba(15,23,42,0.08)',
        'card-hover': '0 8px 16px rgba(15,23,42,0.12)',
        'glow': '0 4px 14px rgba(47,109,246,0.16)',
        'glow-lg': '0 8px 24px rgba(47,109,246,0.20)',
        'nav': '0 4px 6px -1px rgba(15,23,42,0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.36s cubic-bezier(0.2,0,0,1)',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(18px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
