import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07111F",
        "link-blue": "#38BDF8",
        "soft-cyan": "#67E8F9",
        "trust-green": "#22C55E",
        "muted-slate": "#64748B",
      },
      boxShadow: {
        liquid: "0 32px 90px rgba(7, 17, 31, 0.18)",
        soft: "0 18px 50px rgba(15, 23, 42, 0.10)",
      },
      borderRadius: {
        liquid: "2rem",
      },
    },
  },
};

export default config;
