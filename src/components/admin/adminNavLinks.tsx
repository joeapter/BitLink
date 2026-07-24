import { Activity, BarChart3, Building2, CreditCard, FilePlus2, Handshake, Headphones, Home, Phone, RadioTower, Receipt, Settings, Share2, ShoppingCart, Users, Webhook, CarFront } from "lucide-react";

// Single source of truth for the admin nav, shared by the desktop sidebar
// (AdminShell) and the mobile hamburger menu (AdminMobileNav).
export const adminNavLinks = [
  { href: "/admin", label: "Overview", icon: Home },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/lines", label: "Lines", icon: Phone },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/custom-orders", label: "Custom Orders", icon: FilePlus2 },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/provisioning", label: "Provisioning", icon: RadioTower },
  { href: "/admin/plans", label: "Plans", icon: BarChart3 },
  { href: "/admin/referrals", label: "Referrals", icon: Share2 },
  { href: "/admin/sales-reps", label: "Sales Reps", icon: Handshake },
  { href: "/admin/drivers", label: "Drivers", icon: CarFront },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/carrier-rates", label: "Carrier Rates", icon: Receipt },
  { href: "/admin/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/admin/events", label: "Events", icon: Activity },
  { href: "/admin/support", label: "Support", icon: Headphones },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// The nav entry matching the current path — exact match first, else the
// longest href that prefixes it (so /admin/lines/{id} still resolves to Lines).
export function activeAdminLink(pathname: string) {
  return (
    adminNavLinks.find((l) => l.href === pathname) ??
    adminNavLinks
      .filter((l) => l.href !== "/admin" && pathname.startsWith(l.href))
      .sort((a, b) => b.href.length - a.href.length)[0] ??
    (pathname.startsWith("/admin") ? adminNavLinks[0] : undefined)
  );
}
