import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const IL_TZ = 'Asia/Jerusalem';

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', { timeZone: IL_TZ });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', { timeZone: IL_TZ });
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function getSiteUrl() {
  const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL?.trim() ?? process.env.VERCEL_URL?.trim();
  const url = explicitSiteUrl || vercelUrl || "http://localhost:3000";
  const urlWithProtocol = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

  return urlWithProtocol.replace(/\/$/, "");
}

export function absoluteUrl(path = "") {
  const siteUrl = getSiteUrl();
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

// Accepts an Israeli mobile number in any common format: 05x-xxx-xxxx,
// +9725xxxxxxxx, 9725xxxxxxxx. Used to validate port-in numbers BEFORE payment
// so malformed numbers never reach Annatel after money has changed hands.
export function isValidIsraeliMobile(value: string): boolean {
  const cleaned = value.replace(/[\s\-().]/g, "");
  return /^(\+972|972|0)5\d{8}$/.test(cleaned);
}

export function initials(name?: string | null) {
  if (!name) return "BL";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.at(0)?.toUpperCase())
    .join("");
}
