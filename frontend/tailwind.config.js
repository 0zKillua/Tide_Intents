/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#02040A', // Midnight Depth
        surface: '#0D111C',    // Abyssal Plain
        'surface-hover': '#1A2235',
        primary: '#190de3',    // Bright Blue
        secondary: '#00B0FF',  // Lighter Blue Accent
        success: '#190de3',    // Unified Blue (was Green)
        warning: '#FEB019',    // Alert Amber
        error: '#FF4560',      // Liquidate Red
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
