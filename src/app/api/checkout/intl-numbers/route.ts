// Public, read-only list of available US/Canada/UK numbers for the checkout
// picker. Numbers are shown but NOT reserved here — assignment happens at
// provisioning (the orchestrator falls back to any available number in the
// country if the chosen one was taken in the meantime).
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const COUNTRIES = new Set(["us", "canada", "uk"]);
const MAX_NUMBERS = 15;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country") ?? "";
  if (!COUNTRIES.has(country)) {
    return NextResponse.json({ error: "Invalid country" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ numbers: [] });

  const { data } = await admin
    .from("international_dids")
    .select("number, region, city")
    .eq("country", country)
    .eq("status", "available")
    .limit(50);

  const pool = data ?? [];
  // Shuffle so concurrent shoppers don't all fixate on the same numbers.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return NextResponse.json({ numbers: pool.slice(0, MAX_NUMBERS) });
}
