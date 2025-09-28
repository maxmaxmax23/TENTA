/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.css','./index.html','./components/**/*.{html,js,css,jsx}','./src/**/*.{html,jsx,css}'],
  mode: "jit",
  theme: {
    extend: {
      colors: {
        primary: "#00040f",
        secondary: "#00f6ff",
        dimWhite: "rgba(255, 255, 255, 0.7)",
        dimBlue: "rgba(9, 151, 124, 0.1)",
        gold: '#FFD700',
        goldLight: '#FFE066',
        goldDark: '#CCAC00',
        black: '#000000',
        blackDark: '#0A0A0A'
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
    },
    screens: {
      xs: "480px",
      ss: "620px",
      sm: "768px",
      md: "1060px",
      lg: "1200px",
      xl: "1700px",
    },
  },
  plugins: [],
};