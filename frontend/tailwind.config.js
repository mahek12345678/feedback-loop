/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lavender: {
          50: '#F8F5FD',
          100: '#F1E9FA',
          200: '#E4D5F5',
          300: '#CEB6EC',
          400: '#AD8EE1',
          500: '#8F6BD7',
          600: '#7C55C7',
          700: '#6842B1',
          800: '#543492',
          900: '#3D246D',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#FAF9FD',
          muted: '#F1EFF8',
          border: '#E8E4F3',
        },
        ink: {
          DEFAULT: '#252238',
          muted: '#6A6584',
          subtle: '#9A95B2',
        },
        status: {
          success: '#32936F',
          warning: '#E3A044',
          error: '#D65A65',
          info: '#4B7BEC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px -2px rgba(37, 34, 56, 0.05), 0 1px 4px -1px rgba(37, 34, 56, 0.03)',
        'card-hover': '0 8px 24px -4px rgba(143, 107, 215, 0.12), 0 2px 6px -1px rgba(37, 34, 56, 0.04)',
        'subtle': '0 1px 3px 0 rgba(37, 34, 56, 0.04)',
        'elevated': '0 12px 32px -6px rgba(143, 107, 215, 0.18)',
      }
    },
  },
  plugins: [],
}
