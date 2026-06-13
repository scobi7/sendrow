import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Muted forest green — calm, natural, not screaming "eco"
        brand: {
          50:  "#eaf1eb",
          100: "#d3e6d7",
          200: "#a7ccaf",
          300: "#76af87",
          400: "#479163",
          500: "#2b6441",
          600: "#225234",
          700: "#1a4029",
          800: "#122e1e",
          900: "#0b1e13",
          950: "#060f09",
        },
        navy: { 800: "#1e2318", 900: "#141910" },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-hover": "0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
