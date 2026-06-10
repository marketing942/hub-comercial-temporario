import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0b14",
        panel: "#11131f",
        panel2: "#171a28",
        border: "#222638",
        accent: "#7c5cff",
        accent2: "#22d3ee",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        cppem: "#7c5cff",
        unicive: "#22d3ee",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,92,255,0.25), 0 12px 40px -12px rgba(124,92,255,0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
