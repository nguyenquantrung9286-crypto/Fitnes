import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#7C3AED",
          dark: "#5434B3",
          light: "#A78BFA",
        },
        surface: {
          DEFAULT: "#0C0C16",
          card: "#18181B",
          border: "rgba(255,255,255,0.08)",
        },
        success: "#3DD87A",
        danger: "#FF5656",
        muted: "#6B7280",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
