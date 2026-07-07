"use client";

import { useFormStatus } from "react-dom";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function MakeSalesRepButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="secondary" size="sm" disabled={pending} aria-live="polite">
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <UserPlus className="h-4 w-4" aria-hidden="true" />
      )}
      {pending ? "Processing..." : "Make rep"}
    </Button>
  );
}
