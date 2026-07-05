/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        eco: {
          50: '#eefdf4',
          100: '#dafbea',
          200: '#b8f4d4',
          300: '#83eab2',
          400: '#48d689',
          500: '#22bd6c',
          600: '#169954',
          700: '#137944',
          800: '#135f38',
          900: '#114f30',
          950: '#052c19',
        },
        cyber: {
          dark: '#030712',
          card: 'rgba(17, 24, 39, 0.7)',
          border: 'rgba(255, 255, 255, 0.08)',
          glow: 'rgba(34, 189, 108, 0.15)',
          neonGreen: '#22bd6c',
          neonBlue: '#3b82f6',
          neonOrange: '#f97316',
          neonCyan: '#06b6d4',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass-glow': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'neon-green': '0 0 15px rgba(34, 189, 108, 0.4)',
        'neon-blue': '0 0 15px rgba(59, 82, 246, 0.4)',
        'neon-orange': '0 0 15px rgba(249, 115, 22, 0.4)',
        'neon-cyan': '0 0 15px rgba(6, 182, 212, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scanLine 8s linear infinite',
        'radar': 'radarWave 3s ease-out infinite',
      },
      keyframes: {
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        radarWave: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' }
        }
      }
    },
  },
  plugins: [],
}
