/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mandi: {
          dark: '#0a0a0f',
          card: '#12121a',
          border: '#232336',
          primary: '#ff4d4d',
          accent: '#00f2fe',
          neon: '#4facfe',
          amber: '#fbbf24',
          emerald: '#10b981'
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'orb-float': 'orbFloat 4s infinite ease-in-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8', filter: 'drop-shadow(0 0 15px rgba(255, 77, 77, 0.4))' },
          '50%': { transform: 'scale(1.05)', opacity: '1', filter: 'drop-shadow(0 0 30px rgba(0, 242, 254, 0.7))' },
        },
        orbFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
