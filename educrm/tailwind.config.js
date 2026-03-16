/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode:'class',
  theme: {
    extend: {
      colors: {
        primary: '#7C3AED',
        'primary-light': '#8B5CF6',
        'primary-dark': '#6D28D9',
        sidebar: '#1E1B2E',
        'sidebar-hover': '#2D2A40',
        'sidebar-active': '#7C3AED',
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      fontWeight: {
        '500': '500',
        '600': '600',
        '700': '700',
        '800': '800',
        '900': '900',
      },
    },
  },
  plugins: [],
}
