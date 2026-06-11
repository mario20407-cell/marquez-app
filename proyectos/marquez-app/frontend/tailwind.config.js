/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FAEEDA',
          100: '#FAC775',
          200: '#EF9F27',
          400: '#BA7517',
          600: '#854F0B',
          800: '#633806',
          900: '#412402',
        },
        success: { light: '#EAF3DE', DEFAULT: '#3B6D11', dark: '#27500A' },
        danger:  { light: '#FCEBEB', DEFAULT: '#A32D2D', dark: '#791F1F' },
        warn:    { light: '#FAEEDA', DEFAULT: '#854F0B', dark: '#633806' },
        info:    { light: '#E6F1FB', DEFAULT: '#185FA5', dark: '#0C447C' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: { card: '12px' },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08)',
      },
    },
  },
  plugins: [],
}
