/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1A1D29',
        paper: '#F7F8FB',
        slate: {
          DEFAULT: '#E2E5EC',
          dark: '#8A8FA3'
        },
        admin: {
          DEFAULT: '#3949AB',
          dark: '#2A3585',
          soft: '#E8EAF8'
        },
        faculty: {
          DEFAULT: '#00897B',
          dark: '#00695C',
          soft: '#DFF3F0'
        },
        student: {
          DEFAULT: '#C97F00',
          dark: '#A66700',
          soft: '#FCEFD9'
        },
        success: '#2E9E6D',
        warn: '#C97F00',
        danger: '#D64545'
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      borderRadius: {
        card: '10px'
      }
    }
  },
  plugins: []
};
