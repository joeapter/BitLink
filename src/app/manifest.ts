import type { MetadataRoute } from "next";

// Web app manifest — makes BitLink installable to the home screen and opens it
// full-screen (no browser chrome) like a native app. start_url is /admin
// because the installer is the operator using it as an on-the-go admin app; a
// customer who installs simply lands on login. Icons are the existing square
// brand favicons copied to clean public paths.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BitLink",
    short_name: "BitLink",
    description: "BitLink — Israeli mobile, managed.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#050606",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
