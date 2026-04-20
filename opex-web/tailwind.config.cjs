/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      colors: {
        app: {
          base: 'rgb(var(--app-base) / <alpha-value>)',
          surface: 'rgb(var(--app-surface) / <alpha-value>)',
          muted: 'rgb(var(--app-muted) / <alpha-value>)',
          border: 'rgb(var(--app-border) / <alpha-value>)',
          primary: 'rgb(var(--app-primary) / <alpha-value>)',
          secondary: 'rgb(var(--app-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--app-tertiary) / <alpha-value>)',
          inverse: 'rgb(var(--app-inverse) / <alpha-value>)'
        },
        opex: {
          dark: '#112633',
          teal: '#1F4650',
          green: '#E5F8ED',
          greenText: '#22C55E',
          red: '#FEF2F2',
          redText: '#EF4444',
          gray: '#F8F9FB'
        }
      },
      boxShadow: {
        up: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
        soft: '0 14px 40px -18px rgba(15, 23, 42, 0.25)'
      }
    }
  }
};
