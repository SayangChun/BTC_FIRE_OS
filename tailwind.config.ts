import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0B0B",
        foreground: "#F5F5F5",
        surface: "#151515",
        border: "#2A2A2A",
        muted: "#A3A3A3",
        bitcoin: "#F7931A",
        positive: "#22C55E",
        negative: "#EF4444",
      },
      boxShadow: {
        soft: "0 16px 40px rgba(0, 0, 0, 0.28)",
      },
    },
  },
  plugins: [],
};

export default config;
