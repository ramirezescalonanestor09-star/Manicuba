import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rose: {
          50: '#fff5f7',
          100: '#ffe4ea',
          200: '#fdc1cd',
          400: '#f97a99',
          500: '#ec4f7a',
          600: '#d23864',
          700: '#a82550',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'Avenir', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
