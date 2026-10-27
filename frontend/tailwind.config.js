/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0f1117',
        card: '#161b27',
        card2: '#1c2233',
        border: '#2a3248',
        accent: '#6c63ff',
        'accent-hover': '#7c75ff',
        text: '#e8eaf0',
        muted: '#8892a4',
        green: '#22c55e',
        red: '#ef4444',
        amber: '#f59e0b',
        teal: '#14b8a6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
