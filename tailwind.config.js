/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
        dark: {
          900: '#0a0c18',
          800: '#0f1122',
          700: '#14172a',
          600: '#1b1f3a',
          500: '#2a3060',
        },
        bcp: {
          navy: '#0f172a',
          blue: '#1e3a8a',
          royal: '#2563eb',
          sky: '#38bdf8',
          gold: '#f59e0b',
          amber: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Poppins', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Poppins', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.8s ease-out',
        'bounce-slow': 'bounce 3s infinite',
        'shimmer': 'shimmer 4s linear infinite',
        'aurora': 'aurora 25s ease-in-out infinite alternate',
        'marquee-left': 'marqueeLeft 30s linear infinite',
        'marquee-right': 'marqueeRight 30s linear infinite',
        'star-movement': 'starMovement 6s linear infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(147, 51, 234, 0.5)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        aurora: {
          '0%': { transform: 'translate(0px, 0px) scale(1) rotate(0deg)' },
          '50%': { transform: 'translate(40px, -20px) scale(1.1) rotate(3deg)' },
          '100%': { transform: 'translate(-30px, 20px) scale(0.95) rotate(-3deg)' },
        },
        marqueeLeft: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        marqueeRight: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        starMovement: {
          '0%': { transform: 'translate(0%, 0%)' },
          '100%': { transform: 'translate(100%, 0%)' },
        },
      },
    },
  },
  plugins: [],
}
