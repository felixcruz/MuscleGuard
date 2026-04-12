import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: { DEFAULT: '#131413', light: '#202222' },
        lime: { DEFAULT: '#CDFF00', hover: '#b8e600' },
        surface: { DEFAULT: '#f7f7f7', alt: '#ECEEED' },
        mgray: { DEFAULT: '#585A59' },
        muted: { DEFAULT: '#BFC1C0' },
        alert: { DEFAULT: '#FFB4AB' },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
    },
  },
  plugins: [],
};
export default config;
