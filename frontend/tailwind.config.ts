import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'kid-yellow': '#FFD166',
        'kid-orange': '#EF476F',
        'kid-green':  '#06D6A0',
        'kid-blue':   '#118AB2',
        'kid-pink':   '#F472B6',
        'kid-dark':   '#073B4C',
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 107, 53, 0.4)' },
          '50%': { boxShadow: '0 0 12px 4px rgba(255, 107, 53, 0.2)' },
        },
        'bounce-up': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-50px)', opacity: '0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up':  'fade-in-up 0.4s ease-out forwards',
        'bounce-soft': 'bounce-soft 2s ease-in-out infinite',
        'pulse-glow':  'pulse-glow 2s ease-in-out infinite',
        'bounce-up':   'bounce-up 1.5s ease-out forwards',
        'slide-up':    'slide-up 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      },
    },
  },
  plugins: [],
};
export default config;
