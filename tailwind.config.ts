import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0d1b14",
        canopy: {
          50: "#f0f7f1",
          100: "#dcefdf",
          200: "#b9dec0",
          300: "#8bc79a",
          400: "#5aab70",
          500: "#358d51",
          600: "#24713e",
          700: "#1d5a33",
          800: "#19482b",
          900: "#133b24",
          950: "#082014",
        },
        lime: {
          400: "#9ed44b",
          500: "#84c341",
          600: "#6aa42f",
        },
        sand: {
          50: "#fbfaf6",
          100: "#f5f2e9",
          200: "#e9e3d3",
          300: "#d8cfb8",
        },
        clay: {
          500: "#c2712f",
          600: "#a85c22",
        },
        sky: {
          400: "#4aa8d8",
          500: "#2d8fbf",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Sora",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(13, 27, 20, 0.04), 0 8px 24px -12px rgba(13, 27, 20, 0.18)",
        lift: "0 2px 4px rgba(13, 27, 20, 0.06), 0 18px 40px -18px rgba(13, 27, 20, 0.28)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.85)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "grow-x": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "grow-x": "grow-x 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
