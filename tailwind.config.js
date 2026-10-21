/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './packages/studio/src/**/*.{js,jsx}',
    './packages/timecapsule/src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00e5ff',
          hover: '#38bdf8',
        },
        'app-bg': '#09090b',
        'panel-bg': '#121217',
        'card-bg': '#18181f',
        secondary: '#a1a1aa',
        muted: '#52525b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 229, 255, 0.35)',
        'glow-accent': '0 0 20px rgba(99, 102, 241, 0.4)',
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.8)',
      },
    },
  },
  plugins: [],
};
