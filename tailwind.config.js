/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        steel: '#4FB3D9',
        good: '#3E9E6B',
        warn: '#D9A33C',
        crit: '#D4513A',
      },
      fontFamily: {
        mono: ['var(--fm)', 'monospace'],
        sans: ['var(--fd)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
