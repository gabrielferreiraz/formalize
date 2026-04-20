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
        background: "var(--background)",
        foreground: "var(--foreground)",
        stage: {
          400: "#263550",
          500: "#1d2740",
          600: "#161e38",
          700: "#121932",
          800: "#0e1427",
          900: "#090e1c",
        },
        gold: {
          400: "#ffd035",
          500: "#f5c200",
          600: "#d4ab00",
        },
      },
      fontFamily: {
        body: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(6px)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-10px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.94)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(245,194,0,0.35)" },
          "50%": { boxShadow: "0 0 0 6px rgba(245,194,0,0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-out": "fade-out 0.18s cubic-bezier(0.4, 0, 1, 1) both",
        "slide-down": "slide-down 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
        "scale-in": "scale-in 0.18s cubic-bezier(0.22, 1, 0.36, 1)",
        "pulse-gold": "pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
