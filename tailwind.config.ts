import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#06120a",
        panel: "#0c1b13",
        panel2: "#11241a",
        border: "#1f3a2a",
        accent: "#22c55e",
        accent2: "#a3e635",
        success: "#22c55e",
        warning: "#facc15",
        danger: "#ef4444",
        cppem: "#22c55e",
        unicive: "#06b6d4",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(34,197,94,0.25), 0 12px 40px -12px rgba(34,197,94,0.35)",
        glowSoft: "0 0 0 1px rgba(34,197,94,0.18), 0 8px 30px -10px rgba(34,197,94,0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
