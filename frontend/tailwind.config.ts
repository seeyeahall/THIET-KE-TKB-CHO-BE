import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'kid-yellow': '#FFD93D',
        'kid-orange': '#FF6B35',
        'kid-blue': '#4D96FF',
        'kid-green': '#6BCB77',
        'kid-pink': '#FF9F9F',
      },
    },
  },
  plugins: [],
};
export default config;
