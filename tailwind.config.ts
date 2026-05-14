import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050606",
        "link-blue": "#12BDB2",
        "soft-cyan": "#2DDBD0",
        "trust-green": "#13C784",
        "muted-slate": "#667085",
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
