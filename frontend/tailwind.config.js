/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1769AA',
          deep: '#0F4C81',
          hover: '#12578D',
          light: '#EAF4FC',
          50: '#EAF4FC',
          100: '#D5E9F9',
          200: '#A9D2F3',
          300: '#7CB9ED',
          400: '#4FA1E7',
          500: '#1769AA',
          600: '#12578D',
          700: '#0F4C81',
          800: '#0B3A64',
          900: '#072744',
        },
        academic: {
          primary: '#1769AA',
          deep: '#0F4C81',
          hover: '#12578D',
          light: '#EAF4FC',
          bg: '#F5F8FC',
          card: '#FFFFFF',
          text: '#203247',
          secondary: '#718096',
          border: '#E1E8F0',
          success: '#28A879',
          warning: '#E7A33E',
          critical: '#D95763',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F5F8FC',
          muted: '#EAF4FC',
          border: '#E1E8F0',
        },
        ink: {
          DEFAULT: '#203247',
          muted: '#718096',
          subtle: '#94A3B8',
        },
        status: {
          success: '#28A879',
          warning: '#E7A33E',
          critical: '#D95763',
          error: '#D95763',
          info: '#1769AA',
        },
        // Aliases to gracefully transition legacy lavender classes to academic primary blue
        lavender: {
          50: '#EAF4FC',
          100: '#D5E9F9',
          200: '#A9D2F3',
          300: '#7CB9ED',
          400: '#4FA1E7',
          500: '#1769AA',
          600: '#1769AA',
          700: '#0F4C81',
          800: '#0B3A64',
          900: '#072744',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        'sm': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
        '2xl': '12px',
        '3xl': '12px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(15, 76, 129, 0.05), 0 1px 2px -1px rgba(15, 76, 129, 0.03)',
        'card-hover': '0 4px 12px -2px rgba(15, 76, 129, 0.08), 0 2px 4px -1px rgba(15, 76, 129, 0.04)',
        'subtle': '0 1px 2px 0 rgba(15, 76, 129, 0.04)',
        'elevated': '0 4px 14px -2px rgba(15, 76, 129, 0.1)',
      }
    },
  },
  plugins: [],
}
