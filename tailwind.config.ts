import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "emerald-islamic": "#064e3b",
        "emerald-islamic-dark": "#022c22",
        "emerald-islamic-light": "#0f766e",
        "gold-islamic": "#d97706",
        "gold-accent": "#f59e0b",
        "gold-light": "#fef3c7",
        "ivory-bg": "#fbfbfa",
        "ivory-card": "#ffffff",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      boxShadow: {
        islamic: "0 4px 20px -2px rgba(6, 78, 59, 0.12), 0 2px 6px -1px rgba(6, 78, 59, 0.08)",
        "islamic-lg": "0 10px 25px -3px rgba(6, 78, 59, 0.15), 0 4px 10px -2px rgba(217, 119, 6, 0.1)",
        gold: "0 4px 14px 0 rgba(217, 119, 6, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
