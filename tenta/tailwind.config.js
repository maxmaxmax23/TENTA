/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#FFD700',         // primary luxury gold
        black: '#000000',        // deep black background
        darkGray: '#121212',     // for panels or secondary bg
        grayText: '#E0E0E0',     // for secondary text
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        playfair: ['Playfair Display', 'serif'], // elegant headings if needed
      },
      boxShadow: {
        'gold-lg': '0 0 15px rgba(255, 215, 0, 0.6)', // luxury gold glow
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
