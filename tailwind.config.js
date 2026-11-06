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
        ivory: '#F5F2EB',
        carbon: '#111111',
        cyanAccent: '#38BDF8',
        amberAccent: '#F59E0B',
        crimsonAccent: '#EF4444',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['var(--fd)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
