/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1B1D16',
        paper: '#F5F3EC',
        surface: '#FFFFFF',
        line: '#DEDACD',
        moss: {
          50: '#EEF2EA',
          100: '#D7E1D0',
          400: '#5C7A52',
          500: '#3D5A3D',
          600: '#2E4630',
          700: '#233723',
        },
        gold: {
          400: '#D9AC3D',
          500: '#C69214',
          600: '#9E7410',
        },
        clay: '#B4472B',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Work Sans"', 'sans-serif'],
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '3px',
      },
    },
  },
  plugins: [],
}
