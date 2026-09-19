import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        neon: {
          blue: "#38bdf8",
          purple: "#c084fc",
          pink: "#f472b6",
          emerald: "#34d399",
          amber: "#fbbf24",
        }
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(56, 189, 248, 0.35)',
        'neon-purple': '0 0 20px rgba(192, 132, 252, 0.35)',
        'neon-pink': '0 0 20px rgba(244, 114, 182, 0.35)',
        'neon-amber': '0 0 20px rgba(251, 191, 36, 0.4)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      },
    },
  },
  plugins: [],
};
export default config;
