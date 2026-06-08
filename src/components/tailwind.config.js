/** @type {import('tailwindcss').Config} */
export default {
  // Enable class-based dark mode (matches the dark class on <html>)
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
