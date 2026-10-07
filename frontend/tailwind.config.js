/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Public Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'] },
      colors: {
        brand: {
          50: '#f1f7f4', 100: '#dcebe3', 200: '#b9d7c8', 300: '#8dbba6', 400: '#5e9b81',
          500: '#3f7f64', 600: '#2f6650', 700: '#1f4d3a', 800: '#183e2f', 900: '#122f24',
        },
        gold: { 100: '#fbefd3', 400: '#e8b04a', 500: '#d99a1c', 600: '#b77d10' },
      },
    },
  },
  plugins: [],
};
