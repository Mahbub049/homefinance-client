/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Hind Siliguri', 'Noto Sans Bengali', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};