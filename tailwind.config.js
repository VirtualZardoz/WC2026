/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary color from Stitch designs
        primary: '#0995ec',
        // Background colors
        'bg-light': '#f5f7f8',
        'bg-dark': '#101b22',
        // Surface colors (cards, modals)
        'surface-light': '#ffffff',
        'surface-dark': '#18242b',
        'surface-dark-alt': '#1a2630',
        // Text colors
        'text-main-light': '#111518',
        'text-main-dark': '#e0e6eb',
        'text-muted-light': '#5f7b8c',
        'text-muted-dark': '#9ca3af',
        // Border colors
        'border-light': '#dbe2e6',
        'border-dark': '#2a3b47',
        // Keep accent for backwards compatibility
        accent: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
          950: '#4a044e',
        },
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
};
