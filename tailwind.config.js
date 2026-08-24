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
        nexus: {
          950: '#07090e',
          900: '#0b0f19',
          850: '#111726',
          800: '#161e31',
          750: '#1c263c',
          700: '#23304a',
          600: '#334466',
          500: '#485f8a',
          400: '#738cb8',
          300: '#a3b8db',
          200: '#d0ddf2',
          100: '#edf3fc',
          accent: '#38bdf8', // Electric sky cyan
          accentHover: '#0ea5e9',
          purple: '#818cf8',
          purpleHover: '#6366f1',
          online: '#10b981',
          idle: '#f59e0b',
          dnd: '#ef4444',
          offline: '#64748b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-speaking': 'pulseSpeaking 1.5s infinite ease-in-out',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        pulseSpeaking: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)' },
          '50%': { transform: 'scale(1.03)', boxShadow: '0 0 0 6px rgba(16, 185, 129, 0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
