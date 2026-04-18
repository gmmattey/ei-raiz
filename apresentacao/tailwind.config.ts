import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'esquilo-orange': '#F56A2A',
        'deep-graphite': '#0B1218',
        'warm-bone': '#F5F0EB',
        'sand-surface': '#EFE7DC',
      },
      fontFamily: {
        'sora': ['Sora', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config