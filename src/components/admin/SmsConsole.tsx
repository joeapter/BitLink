"use client";

// Admin SMS console. Sending happens from Joe's OWN phone via sms: links —
// the message goes out on his BitLink line, costs nothing (it's inside the
// plan's SMS allowance), and students can reply to a real Israeli number.
// This page just picks the recipient, personalizes the text, hands it to the
// Messages app, and logs the handoff. Built mobile-first: the phone is where
// this actually gets used.

import { useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

export type SmsRecipient = {
  customerId: string;
  name: string | null;
  email: string | null;
  lineNumber: string | null;
  contactPhone: string | null;
  lineStatus: string | null;
  isKosher: boolean;
  /** Address their texts forward to, or null if forwarding isn't on. */
  forwardingEmail: string | null;
  referralCode: string | null;
  optOut: boolean;
};

export type SmsTemplate = { id: string; name: string; body: string };

export type SmsLogRow = {
  id: string;
  toNumber: string;
  body: string;
  campaign: string | null;
  status: string;
  error: string | null;
  createdAt: string;
  customerName: string | null;
};

const SITE_URL = "https://bitlink.co.il";

// GSM-7 vs UCS-2 segment estimate. Any non-GSM character (Hebrew included)
// switches the whole message to 70-char segments.
function segmentInfo(text: string): { chars: number; segments: number; encoding: string } {
  const gsm = /^[A-Za-z0-9 @£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-./:;<=>?¡ÄÖÑܧ¿äöñüà\n\r^{}\\[~\]|€]*$/;
  const isGsm = gsm.test(text);
  const chars = text.length;
  const single = isGsm ? 160 : 70;
  const multi = isGsm ? 153 : 67;
  const segments = chars === 0 ? 0 : chars <= single ? 1 : Math.ceil(chars / multi);
  return { chars, segments, encoding: isGsm ? "GSM" : "Unicode" };
}

function personalize(template: string, recipient: SmsRecipient | null): string {
  const firstName = recipient?.name?.trim().split(/\s+/)[0] || "there";
  const link = recipient?.referralCode
    ? `${SITE_URL}/signup?referral=${recipient.referralCode}`
    : SITE_URL;
  return template
    .replaceAll("{name}", firstName)
    .replaceAll("{email}", recipient?.email?.trim() || "your email")
    .replaceAll("{link}", link);
}

// iOS wants `sms:NUMBER&body=...`; Android and everything else use `?body=`.
// Getting this wrong silently drops the message text, so it's worth branching.
function smsHref(to: string, body: string, isIOS: boolean): string {
  return `sms:${to}${isIOS ? "&" : "?"}body=${encodeURIComponent(body)}`;
}

// The user agent is client-only, so it's read through useSyncExternalStore
// (server snapshot false) rather than an effect — no hydration mismatch, and
// the value never changes so there's nothing to subscribe to.
const subscribeToNothing = () => () => {};
const getIsIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (/Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
const getIsIOSOnServer = () => false;

export function SmsConsole({
  recipients,
  templates: initialTemplates,
  log,
  migrationApplied,
}: {
  recipients: SmsRecipient[];
  templates: SmsTemplate[];
  log: SmsLogRow[];
  migrationApplied: boolean;
}) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | "">(initialTemplates[0]?.id ?? "");
  const [body, setBody] = useState(initialTemplates[0]?.body ?? "");
  const [campaign, setCampaign] = useState(initialTemplates[0]?.name ?? "");
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [search, setSearch] = useState("");
  const [forwardingOnly, setForwardingOnly] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [opened, setOpened] = useState<Record<string, true>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const isIOS = useSyncExternalStore(subscribeToNothing, getIsIOS, getIsIOSOnServer);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recipients.filter((r) => {
      if (forwardingOnly && !r.forwardingEmail) return false;
      if (!q) return true;
      return [r.name, r.email, r.lineNumber, r.contactPhone].some((v) => v?.toLowerCase().includes(q));
    });
  }, [recipients, search, forwardingOnly]);

  const previewRecipient = recipients.find((r) => r.customerId === previewId) ?? filtered[0] ?? null;
  const seg = segmentInfo(personalize(body, previewRecipient));

  function applyTemplate(id: string) {
    setSelectedTemplateId(id);
    const template = templates.find((t) => t.id === id);
    if (template) {
      setBody(template.body);
      setCampaign(template.name);
    }
  }

  async function saveTemplate(asNew: boolean) {
    const name = templateName.trim() || campaign.trim();
    if (!body.trim() || !name) {
      setBanner("Give the template a name and a body first.");
      return;
    }
    setSavingTemplate(true);
    setBanner(null);
    try {
      const isUpdate = !asNew && selectedTemplateId;
      const res = await fetch(
        isUpdate ? `/api/admin/sms/templates/${selectedTemplateId}` : "/api/admin/sms/templates",
        {
          method: isUpdate ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, body }),
        },
      );
      const payload = await res.json();
      if (!res.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Save failed");
      const saved = payload.data as SmsTemplate;
      setTemplates((prev) => {
        const without = prev.filter((t) => t.id !== saved.id);
        return [...without, saved].sort((a, b) => a.name.localeCompare(b.name));
      });
      setSelectedTemplateId(saved.id);
      setTemplateName("");
      setBanner(`Template "${saved.name}" saved.`);
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingTemplate(false);
    }
  }

  async function deleteTemplate() {
    if (!selectedTemplateId) return;
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!template) return;
    if (!window.confirm(`Delete template "${template.name}"?`)) return;
    const res = await fetch(`/api/admin/sms/templates/${selectedTemplateId}`, { method: "DELETE" });
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== selectedTemplateId));
      setSelectedTemplateId("");
      setBanner(`Template "${template.name}" deleted.`);
    }
  }

  // Fire-and-forget log as the sms: link opens. keepalive lets the request
  // survive the app switch to Messages.
  function logHandoff(recipient: SmsRecipient, to: string) {
    setOpened((prev) => ({ ...prev, [recipient.customerId]: true }));
    void fetch("/api/admin/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        body,
        campaign: campaign.trim() || undefined,
        channel: "device",
        recipients: [
          {
            customerId: recipient.customerId,
            to,
            name: recipient.name,
            email: recipient.email,
            referralCode: recipient.referralCode,
          },
        ],
      }),
    }).catch(() => {});
  }

  return (
    <div className="grid gap-4 sm:gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">SMS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">Text messages</h1>
        <p className="mt-2 text-sm text-muted-slate">
          Pick a template, choose a student, and tap Text — it opens Messages on your phone with the text ready to
          send. Placeholders:{" "}
          <code className="rounded bg-slate-100 px-1">{"{name}"}</code> becomes their first name,{" "}
          <code className="rounded bg-slate-100 px-1">{"{email}"}</code> their account email, and{" "}
          <code className="rounded bg-slate-100 px-1">{"{link}"}</code> their referral link.
        </p>
      </section>

      {!migrationApplied && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Migration 032 isn&apos;t applied yet — run supabase/migrations/032_sms_messages.sql in the Supabase SQL
          editor (by hand, per the stale-migration-history situation) to enable templates, the send log, and opt-outs.
        </div>
      )}
      {banner && (
        <div className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-soft">
          {banner}
        </div>
      )}

      {/* Composer */}
      <section className="grid gap-4 rounded-2xl border border-ink/10 bg-white p-4 shadow-soft sm:rounded-4xl sm:p-5 lg:grid-cols-2">
        <div className="grid content-start gap-3">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-slate">Template</label>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedTemplateId}
              onChange={(e) => applyTemplate(e.target.value)}
              className="h-11 min-w-0 flex-1 rounded-2xl border border-ink/10 bg-white px-4 text-sm font-semibold text-ink"
            >
              <option value="">— Blank message —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {selectedTemplateId && (
              <Button type="button" variant="danger" size="sm" onClick={deleteTemplate}>
                Delete
              </Button>
            )}
          </div>

          <label className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-slate">Message</label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Hi {name}, ..." />
          <p className="text-xs text-muted-slate">
            {seg.chars} chars · {seg.segments} segment{seg.segments === 1 ? "" : "s"} ({seg.encoding}) — counted on the
            personalized preview. Hebrew switches to 70-char segments.
          </p>

          <label className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-slate">
            Campaign label (for the log)
          </label>
          <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="e.g. Elul 5GB referral push" />

          <div className="mt-2 flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-slate">
                Save as template
              </label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name"
                className="mt-1"
              />
            </div>
            {selectedTemplateId && (
              <Button type="button" variant="secondary" size="sm" disabled={savingTemplate} onClick={() => saveTemplate(false)}>
                Update
              </Button>
            )}
            <Button type="button" variant="secondary" size="sm" disabled={savingTemplate} onClick={() => saveTemplate(true)}>
              Save new
            </Button>
          </div>
        </div>

        <div className="grid content-start gap-2 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-slate">
            Preview{previewRecipient ? ` — ${previewRecipient.name ?? previewRecipient.email ?? "customer"}` : ""}
          </p>
          <p className="whitespace-pre-wrap rounded-2xl border border-ink/10 bg-white p-4 text-sm text-ink">
            {personalize(body, previewRecipient) || "Type a message to preview it."}
          </p>
          <p className="text-xs text-muted-slate">Tap a student below to preview with their name and link.</p>
        </div>
      </section>

      {/* Recipients — cards, so this is usable one-handed on a phone */}
      <section className="grid gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-ink">Customers ({filtered.length})</p>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or number"
            aria-label="Search customers"
            className="sm:w-80"
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={forwardingOnly}
            onChange={(e) => setForwardingOnly(e.target.checked)}
            className="h-4 w-4 rounded border-ink/20"
          />
          Only show customers with SMS-to-email already set up
        </label>

        {filtered.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((r) => {
              const to = r.lineNumber ?? r.contactPhone;
              const blocked = r.optOut || !to || !body.trim();
              const wasOpened = opened[r.customerId];
              return (
                <li
                  key={r.customerId}
                  onClick={() => setPreviewId(r.customerId)}
                  className={`rounded-2xl border bg-white p-4 shadow-soft transition ${
                    previewId === r.customerId ? "border-link-blue/50 bg-sky-50/40" : "border-ink/10"
                  }`}
                >
                  <p className="font-semibold text-ink">{r.name ?? "—"}</p>
                  <p className="truncate text-xs text-muted-slate">{r.email ?? ""}</p>
                  <p className="mt-1 font-mono text-xs text-slate-700">
                    {to ?? "no number on file"}
                    {to && !r.lineNumber && <span className="ml-1 text-muted-slate">(contact #)</span>}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.forwardingEmail && (
                      <span
                        title={`Texts forward to ${r.forwardingEmail}`}
                        className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                      >
                        SMS→email on
                      </span>
                    )}
                    {r.optOut && (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                        opted out
                      </span>
                    )}
                    {r.isKosher && (
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
                        kosher line
                      </span>
                    )}
                    {r.lineStatus === "paused" && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        paused
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    {blocked ? (
                      <span className="text-xs font-semibold text-muted-slate">
                        {r.optOut ? "Opted out — don't text" : !to ? "No number on file" : "Write a message first"}
                      </span>
                    ) : (
                      <a
                        href={smsHref(to, personalize(body, r), isIOS)}
                        onClick={() => logHandoff(r, to)}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-link-blue/30 bg-[#e6fbff] px-5 text-sm font-semibold text-ink shadow-[0_16px_45px_rgba(0,174,202,0.16)] transition hover:bg-[#d8f7fd]"
                      >
                        {wasOpened ? "Text again" : "Text"}
                      </a>
                    )}
                    {wasOpened && (
                      <p className="mt-2 text-xs font-semibold text-emerald-700">
                        Opened in Messages.
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft sm:rounded-4xl">
            <EmptyState title="No customers match" />
          </div>
        )}
      </section>

      {/* Log */}
      <section className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-soft sm:rounded-4xl">
        <p className="border-b border-ink/8 p-4 text-sm font-semibold text-ink">Recent messages</p>
        {log.length ? (
          <ul className="divide-y divide-ink/8">
            {log.map((row) => (
              <li key={row.id} className="grid gap-1 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{row.customerName ?? row.toNumber}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      row.status === "sent" || row.status === "opened"
                        ? "bg-emerald-50 text-emerald-700"
                        : row.status === "failed"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {row.status}
                  </span>
                  <span className="text-xs text-muted-slate">{formatDate(row.createdAt)}</span>
                </div>
                <p className="font-mono text-xs text-slate-600">{row.toNumber}</p>
                {row.campaign && <p className="text-xs text-muted-slate">{row.campaign}</p>}
                <p className="line-clamp-2 text-xs text-slate-600">{row.body}</p>
                {row.error && <p className="text-xs font-semibold text-rose-700">{row.error}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6">
            <EmptyState title="Nothing sent yet" />
          </div>
        )}
      </section>
    </div>
  );
}
