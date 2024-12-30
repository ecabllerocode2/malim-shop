/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "gris":"#d9d9d9",
        "biege":"#d9ab91",
        "texto":"#593528",
        "titulo":"#8c2e26",
        "cobre":"#a66953",
      },
      fontFamily: {
        playfair: ["Playfair Display", "serif"],
        montserrat: ["Montserrat", "sans-serif"],
      }
    },
  },
  plugins: [],
}

