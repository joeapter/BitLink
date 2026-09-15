// Mirrors the BitLink web palette (tailwind.config.ts) so the native screens
// and the account portal rendered in the WebView read as one product.
export const colors = {
  ink: "#050606",
  accent: "#12BDB2",
  accentSoft: "#E6F8F7",
  softCyan: "#2DDBD0",
  green: "#13C784",
  muted: "#667085",
  border: "rgba(5, 6, 6, 0.10)",
  surface: "#FFFFFF",
  background: "#F7FAFC",
  inactive: "#98A2B3",
} as const;

export const SITE_URL = "https://www.bitlink.co.il";

export const contact = {
  whatsappNumber: "972555195375",
  whatsappDisplay: "+972 55-519-5375",
  israelTel: "+972555195375",
  israelDisplay: "055-519-5375",
  usaTel: "+19295978919",
  usaDisplay: "929-597-8919",
  email: "support@bitlink.co.il",
} as const;
