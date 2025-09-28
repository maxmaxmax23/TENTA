/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#D4AF37',
        darkbg: '#0A0A0A',
        dimGold: 'rgba(212, 175, 55, 0.3)',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(212, 175, 55, 0.7)',
      },
      transitionProperty: {
        'height-opacity': 'height, opacity',
      },
    },
  },
  plugins: [],
};
