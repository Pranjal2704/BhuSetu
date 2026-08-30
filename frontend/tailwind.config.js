/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        govblue: {
          50: '#f0f5fa',
          100: '#e1ebf5',
          600: '#1d4ed8', // classic gov blue
          800: '#1e3a8a',
          900: '#0f172a'
        }
      }
    },
  },
  plugins: [],
}
