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
          500: "#2F9E68",
          600: "#3F6B4F",
          700: "#2d5239",
          800: "#1b4c36",
          900: "#173f2e",
          950: "#0b231a",
        },
        navy: {
          800: "#1e2a4a",
          900: "#16203a",
        },
        canopy: {
          bg: "var(--bg)",
          text: "var(--text)",
          muted: "var(--text-muted)",
          primary: "var(--primary)",
          tint: "var(--primary-tint)",
          track: "var(--track-bg)",
          divider: "var(--divider)",
          green: "var(--status-green)",
          surface: "var(--surface)",
        },
      },
      borderRadius: {
        "canopy-lg": "var(--radius-lg)",
        "canopy-sm": "var(--radius-sm)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        data: ["var(--font-data)", "monospace"],
        mono: ["var(--font-data)", "monospace"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
    },
  },
  plugins: [],
};
export default config;
