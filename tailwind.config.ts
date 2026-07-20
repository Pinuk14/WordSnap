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
        background: "#0D0D0D",
        card: "#F5F0E8",
        primary: "#FF2E93",
        secondary: "#00F0FF",
        accent: "#8C1EFF",
        warning: "#F9F002",
        danger: "#FF3B30",
        success: "#4ADE80",
        foreground: "#FFFFFF",
      },
      fontFamily: {
        sans: ['"Space Grotesk"', "sans-serif"],
        display: ['"Press Start 2P"', "cursive"],
      },
      boxShadow: {
        'brutal': '6px 6px 0 #000',
        'brutal-pressed': '2px 2px 0 #000',
      },
      borderRadius: {
        'brutal': '4px',
      },
      transitionTimingFunction: {
        'brutal': 'linear',
      }
    },
  },
  plugins: [],
};
export default config;
