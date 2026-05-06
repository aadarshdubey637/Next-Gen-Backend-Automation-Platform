/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#10b981",
        secondary: "#6366f1",
        deep: "#030712",
        surface: "#0b1120",
      },
    },
  },
  plugins: [],
}
