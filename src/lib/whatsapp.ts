// Builds web.whatsapp.com links for admin "message this customer" buttons.
// Deliberately NOT wa.me: wa.me hands off to the native desktop app, which on
// Joe's Mac is his PERSONAL WhatsApp. The web URL opens in the browser, where
// the BitLink business account is the logged-in session.
export function whatsappWebUrl(rawPhone: string | null | undefined, text?: string): string | null {
  if (!rawPhone) return null;
  let digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!digits) return null;
  // Local Israeli format (05x-...) → international.
  if (digits.startsWith("0")) digits = `972${digits.slice(1)}`;
  const params = new URLSearchParams({ phone: digits });
  if (text) params.set("text", text);
  return `https://web.whatsapp.com/send?${params.toString()}`;
}

export function whatsappGreeting(fullName: string | null | undefined): string {
  const firstName = (fullName ?? "").trim().split(/\s+/)[0];
  return firstName ? `Hi ${firstName}, it's Joe from BitLink — ` : "Hi, it's Joe from BitLink — ";
}
