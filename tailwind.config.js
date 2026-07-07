/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./packages/ui/src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@mriqbox/ui-kit/dist/**/*.{js,mjs}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
