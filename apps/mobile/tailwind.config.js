/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        base: '#eceeff',
        base2: '#f6f7fe',
        surface: '#ffffff',
        brand: {
          DEFAULT: '#6366f1',
          soft: '#4f46e5',
        },
        violet: '#8b5cf6',
        ink: {
          DEFAULT: '#15151c',
          soft: '#4b4b57',
          faint: '#8a8a99',
        },
        glassline: 'rgba(20,20,40,0.08)',
      },
      borderRadius: {
        glass: '20px',
        'glass-lg': '28px',
      },
    },
  },
  plugins: [],
}
