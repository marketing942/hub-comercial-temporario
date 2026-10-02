import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Tema por variaveis CSS (globals.css): padrao = rebranding CPPEM (preto + dourado);
        // html[data-theme="colegio_cppem"] troca para o azul do Colegio.
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        panel: "rgb(var(--c-panel) / <alpha-value>)",
        panel2: "rgb(var(--c-panel2) / <alpha-value>)",
        border: "rgb(var(--c-border) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        accent2: "rgb(var(--c-accent2) / <alpha-value>)",
        success: "#22c55e",
        warning: "#facc15",
        danger: "#ef4444",
        cppem: "#c9ae7a",
        unicive: "#F5C518",
        colegio: "#5aa2ff",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgb(var(--c-accent) / 0.25), 0 12px 40px -12px rgb(var(--c-accent) / 0.35)",
        glowSoft: "0 0 0 1px rgb(var(--c-accent) / 0.18), 0 8px 30px -10px rgb(var(--c-accent) / 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
