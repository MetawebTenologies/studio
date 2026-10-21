/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'app-bg': '#09090b',
        'panel-bg': '#121217',
        'card-bg': '#18181f',
        primary: '#00e5ff',
        secondary: '#a1a1aa',
        muted: '#52525b',
      },
    },
  },
  plugins: [],
};
