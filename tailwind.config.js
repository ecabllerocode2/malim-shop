/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Principal - Emocional y Femenina
        primary: {
          50: '#fef5f0',
          100: '#fde9dd',
          200: '#fbd0bb',
          300: '#f8b099',
          400: '#f59177',
          500: '#d88c6d', // biege original
          600: '#c67755',
          700: '#a86246',
          800: '#8a4e38',
          900: '#6c3a2a',
        },
        secondary: {
          50: '#fef9ed',
          100: '#fef3d6',
          200: '#fce7ad',
          300: '#fadb84',
          400: '#f8cf5b',
          500: '#f6d28c', // cobre original
          600: '#e4b964',
          700: '#c99d4f',
          800: '#a6813f',
          900: '#846530',
        },
        neutral: {
          50: '#fdfbf7',
          100: '#f9f5ed',
          200: '#f5ebdd', // gris original
          300: '#e8d9c4',
          400: '#dbc7ab',
          500: '#ceb592',
          600: '#b39878',
          700: '#987b5e',
          800: '#7d5e44',
          900: '#62412a',
        },
        accent: {
          rose: '#e8b4b8',
          lavender: '#d4c5e2',
          sage: '#c8d5b9',
          coral: '#f4a89e',
        },
        // Colores Semánticos
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
      },
      fontFamily: {
        playfair: ["Playfair Display", "serif"],
        montserrat: ["Montserrat", "sans-serif"],
      },
      fontSize: {
        'display': ['4rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'h1': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'h2': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'h3': ['1.875rem', { lineHeight: '1.3' }],
        'h4': ['1.5rem', { lineHeight: '1.4' }],
        'h5': ['1.25rem', { lineHeight: '1.5' }],
        'body-lg': ['1.125rem', { lineHeight: '1.7' }],
        'body': ['1rem', { lineHeight: '1.7' }],
        'body-sm': ['0.875rem', { lineHeight: '1.6' }],
        'caption': ['0.75rem', { lineHeight: '1.5' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 20px -3px rgba(0, 0, 0, 0.1), 0 15px 30px -2px rgba(0, 0, 0, 0.06)',
        'large': '0 10px 40px -3px rgba(0, 0, 0, 0.12), 0 20px 50px -2px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 20px rgba(216, 140, 109, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
}

