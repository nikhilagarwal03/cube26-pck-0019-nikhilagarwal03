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
        industrial: {
          background: "#09090b",
          seal: "#10b981",
          stop: "#ef4444",
          uncertain: "#f59e0b",
        },
      },
    },
  },
  plugins: [],
};

export default config;