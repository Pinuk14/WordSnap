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
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        slideIn: {
          '0%': { transform: 'translateY(100px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0) scale(0.5)', opacity: '0' },
          '20%': { transform: 'translateY(-20px) scale(1.2)', opacity: '1' },
          '100%': { transform: 'translateY(-100px) scale(1)', opacity: '0' },
        }
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
        slideIn: 'slideIn 0.2s ease-out',
        floatUp: 'floatUp 2.5s ease-out forwards',
      }
    },
  },
  plugins: [],
};
export default config;
