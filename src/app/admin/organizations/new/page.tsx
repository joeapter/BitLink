import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createOrganizationAction } from "../actions";

export const metadata: Metadata = { title: "New Organization" };

export default async function NewOrganizationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">Organizations</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">New organization</h1>
      </section>

      <section className="rounded-[2rem] border border-ink/10 bg-white p-8 shadow-soft">
        <form action={createOrganizationAction} className="grid gap-5 max-w-lg">
          <Input label="Organization name" name="name" required placeholder="e.g. Yeshivas Mir" />

          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-ink" htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              defaultValue="yeshiva"
              className="h-11 rounded-2xl border border-ink/10 bg-white px-4 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-link-blue"
            >
              <option value="yeshiva">Yeshiva</option>
              <option value="seminary">Seminary</option>
              <option value="shul">Shul</option>
              <option value="other">Other</option>
            </select>
          </div>

          <Input label="Contact name" name="contactName" placeholder="Optional" />
          <Input label="Contact email" name="contactEmail" type="email" placeholder="Optional" />

          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-ink" htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Optional internal notes"
              className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted-slate focus:outline-none focus:ring-2 focus:ring-link-blue"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              {decodeURIComponent(error)}
            </div>
          ) : null}

          <div className="flex gap-3 pt-2">
            <Button type="submit">Create organization</Button>
            <Link href="/admin/organizations">
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
