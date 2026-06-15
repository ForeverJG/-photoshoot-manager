/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      maxWidth: {
        mobile: '428px',
      },
      colors: {
        primary: {
          50: '#fef3f2',
          100: '#fee4e2',
          200: '#ffcdc9',
          300: '#fea8a1',
          400: '#fb7a6e',
          500: '#f24e3e',
          600: '#e03a2b',
          700: '#bc2d20',
          800: '#9b291e',
          900: '#802820',
        },
      },
    },
  },
  plugins: [],
};
