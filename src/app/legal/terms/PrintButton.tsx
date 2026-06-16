"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-ink/90"
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      Print / Save PDF
    </button>
  );
}
