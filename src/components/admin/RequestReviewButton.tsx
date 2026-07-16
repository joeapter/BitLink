"use client";

import { useFormStatus } from "react-dom";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function RequestReviewButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="secondary" size="sm" disabled={pending} aria-live="polite">
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Star className="h-4 w-4" aria-hidden="true" />
      )}
      {pending ? "Sending..." : "Ask for review"}
    </Button>
  );
}
