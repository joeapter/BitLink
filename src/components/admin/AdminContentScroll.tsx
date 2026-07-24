"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// On phones the admin nav stacks ABOVE the content, so after tapping a console
// tab the viewport stays parked on the list of tabs and it's unclear the page
// even changed. On every route change (mobile only — on desktop the nav sits
// beside the content), scroll down to the top of the content so the freshly
// loaded page is actually visible. Skips the initial load so arriving at an
// admin URL doesn't yank the view.
export function AdminContentScroll() {
  const pathname = usePathname();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (typeof window === "undefined") return;
    // lg breakpoint — at/above it the nav is a side column, no scroll needed.
    if (window.innerWidth >= 1024) return;
    document.getElementById("admin-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [pathname]);

  return null;
}
