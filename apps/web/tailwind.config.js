const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
    // Pull utility classes used inside shared libs too, in case we ever
    // template-render with tailwind classes from there.
    join(__dirname, '../../libs/**/!(*.stories|*.spec).{ts,html}'),
  ],
  theme: {
    extend: {
      fontFamily: {
        serifTC: ['"Noto Serif TC"', 'serif'],
      },
      colors: {
        brand: {
          50:  '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
      },
      boxShadow: {
        tile: '0 6px 14px rgba(0,0,0,0.35), inset 0 -3px 0 rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
};
