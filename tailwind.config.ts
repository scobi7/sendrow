import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0faf4",
          100: "#dbf2e3",
          200: "#bae4cb",
          300: "#8cceaa",
          400: "#5ab184",
          500: "#379566",
          600: "#267751",
          700: "#1f5f42",
          800: "#1b4c36",
          900: "#173f2e",
          950: "#0b231a",
        },
        navy: {
          800: "#1e2a4a",
          900: "#16203a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
