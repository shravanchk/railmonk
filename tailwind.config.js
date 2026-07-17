/** @type {import('tailwindcss').Config} */
module.exports = {
  // Align Tailwind's dark: variant with the site's existing body.dark-theme toggle.
  darkMode: ['class', '.dark-theme'],
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand saffron (#EA580C) — railway-signal orange with an accessible scale.
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        ink: {
          DEFAULT: '#1a2332',
          soft: '#334155',
          muted: '#64748b',
        },
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'Manrope', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['Manrope', '"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(26, 35, 50, 0.04), 0 6px 24px -12px rgba(26, 35, 50, 0.12)',
        card: '0 1px 3px rgba(26, 35, 50, 0.05), 0 12px 32px -16px rgba(26, 35, 50, 0.18)',
        lift: '0 8px 30px -12px rgba(234, 88, 12, 0.25)',
      },
      maxWidth: {
        content: '1200px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Subtle motion for the homepage guide-card illustrations.
        'gc-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'gc-grow': {
          '0%, 100%': { transform: 'scaleY(0.8)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'gc-drop': {
          '0%': { transform: 'translateY(-14px)', opacity: '0' },
          '15%, 70%': { opacity: '1' },
          '100%': { transform: 'translateY(22px)', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'gc-float': 'gc-float 3.4s ease-in-out infinite',
        'gc-grow': 'gc-grow 3s ease-in-out infinite',
        'gc-drop': 'gc-drop 2.8s ease-in infinite',
      },
    },
  },
  plugins: [],
}
