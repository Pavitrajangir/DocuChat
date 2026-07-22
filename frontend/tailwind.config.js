/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#171B24',
        surface: '#1F2531',
        'surface-2': '#262D3B',
        paper: '#EDE3CE',
        'paper-ink': '#2B2013',
        text: '#E8E2D3',
        'text-muted': '#9AA1B0',
        brass: '#C9A227',
        'brass-light': '#E0B93B',
        sage: '#7C9A82',
        border: '#333B4C',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
