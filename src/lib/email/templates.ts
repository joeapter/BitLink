// Email HTML templates for BitLink transactional emails.
// Plain HTML — no React Email dependency needed.

import { buildAppleEsimInstallUrl } from '@/lib/esim';

const BRAND_COLOR = '#00A3A3';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitlink.co.il';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatIls(amountAgorot: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 2,
  }).format(amountAgorot / 100);
}

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BitLink</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Logo / header -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <a href="${BASE_URL}" style="text-decoration:none;">
            <img src="${BASE_URL}/assets/logo-v2.png" alt="BitLink" width="160" height="53" style="display:inline-block;width:160px;height:53px;" />
          </a>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:20px;padding:40px;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
          ${body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;font-size:12px;color:#94a3b8;">
          BitLink Ltd. · Reg. 341280188 · HaRashar Hirsch 4/1, Israel<br/>
          <a href="${BASE_URL}" style="color:${BRAND_COLOR};text-decoration:none;">${BASE_URL.replace('https://', '')}</a>
          &nbsp;·&nbsp;
          <a href="mailto:support@bitlink.co.il" style="color:${BRAND_COLOR};text-decoration:none;">support@bitlink.co.il</a>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:100px;text-decoration:none;margin:8px 0;">${text}</a>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#050606;line-height:1.2;">${text}</h1>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">${text}</p>`;
}

function mono(text: string): string {
  return `<span style="font-family:monospace;background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:13px;color:#050606;">${text}</span>`;
}

// ── Welcome email — sent right after payment confirmed ────────────────────────

export interface WelcomeEmailParams {
  fullName: string;
  email: string;
  planName: string;
  loginUrl: string;      // magic link or /login
  tempPassword?: string; // only if using temp password flow
  isEsim: boolean;
}

export function buildWelcomeEmail(params: WelcomeEmailParams): string {
  const { fullName, email, planName, loginUrl, tempPassword, isEsim } = params;
  const firstName = fullName.split(' ')[0] ?? fullName;

  const credBlock = tempPassword
    ? `<div style="background:#f8fafc;border-radius:12px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Your login credentials</p>
        <p style="margin:0 0 8px;font-size:14px;color:#050606;">Email: ${mono(email)}</p>
        <p style="margin:0;font-size:14px;color:#050606;">Temporary password: ${mono(tempPassword)}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">You'll be prompted to change this on first login.</p>
      </div>`
    : '';

  const simNote = isEsim
    ? `<div style="background:#eff6ff;border-left:3px solid ${BRAND_COLOR};border-radius:0 12px 12px 0;padding:16px 20px;margin:20px 0;">
        <p style="margin:0;font-size:14px;color:#1e40af;font-weight:600;">eSIM order</p>
        <p style="margin:6px 0 0;font-size:14px;color:#1e40af;">Your eSIM activation code will appear in your account portal once your line is live — usually within a few minutes. We'll also email it to you the moment it's ready.</p>
      </div>`
    : `<div style="background:#f0fdf4;border-left:3px solid #22c55e;border-radius:0 12px 12px 0;padding:16px 20px;margin:20px 0;">
        <p style="margin:0;font-size:14px;color:#15803d;font-weight:600;">Physical SIM</p>
        <p style="margin:6px 0 0;font-size:14px;color:#15803d;">Your SIM card will ship within 1–2 business days. Tracking details will be emailed separately.</p>
      </div>`;

  return layout(`
    ${h1(`Welcome to BitLink, ${firstName}!`)}
    ${p(`Your <strong>${planName}</strong> plan is confirmed and we're setting up your Israeli number right now.`)}
    ${p('Activation usually takes <strong>3–5 minutes</strong>. You can watch the status live in your account portal.')}
    ${simNote}
    ${credBlock}
    <div style="text-align:center;margin:28px 0;">
      ${btn('Open your account', loginUrl)}
    </div>
    ${p('Questions? Reply to this email or WhatsApp us at <a href="https://wa.me/972555195375" style="color:' + BRAND_COLOR + ';">+972-55-519-5375</a>.')}
  `);
}

// ── eSIM ready email — sent when Annatel line is ACTIVE ───────────────────────

export interface EsimReadyEmailParams {
  fullName: string;
  activationCode: string;   // LPA string: LPA:1$smdp.address$token
  planName: string;
  portalUrl: string;
  showIntlNumberNudge?: boolean;
}

// One-line add-on nudge for post-activation emails. Only shown when the line
// doesn't already have a US/Canada/UK number (and never for kosher lines).
function intlNumberNudge(portalUrl: string): string {
  return p(
    `One thing many customers add: a <strong>US, Canadian, or UK number</strong> on the same phone for $9.99/month — family dials a local number, and it receives US verification texts (tested with real bank and Google codes). Takes a minute in <a href="${portalUrl}" style="color:` + BRAND_COLOR + `;">your account</a>, and you pick the exact number.`,
  );
}

export function buildEsimReadyEmail(params: EsimReadyEmailParams): string {
  const { fullName, activationCode, planName, portalUrl, showIntlNumberNudge } = params;
  const firstName = fullName.split(' ')[0] ?? fullName;

  // QR code image via qrserver.com — no npm package needed
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(activationCode)}`;
  const appleInstallUrl = buildAppleEsimInstallUrl(activationCode);

  return layout(`
    ${h1(`Your eSIM is ready, ${firstName}!`)}
    ${p(`Your <strong>${planName}</strong> line is active. Install your eSIM now to start making and receiving calls in Israel.`)}

    <div style="background:#eff6ff;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
      <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1e40af;">Reading this email on your iPhone?</p>
      <p style="margin:0 0 16px;font-size:12px;color:#1e40af;">No need to scan anything — tap below to install directly on this device.</p>
      ${btn('Install eSIM now', appleInstallUrl)}
    </div>

    <div style="text-align:center;margin:28px 0;">
      <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#050606;">Installing from a different device?</p>
      <p style="margin:0 0 12px;font-size:12px;color:#94a3b8;">Scan this QR code with the phone that'll use the eSIM</p>
      <img src="${qrUrl}" alt="eSIM QR Code" width="220" height="220" style="border-radius:12px;border:1px solid #e2e8f0;" />
      <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">iOS: Settings → Mobile → Add eSIM → Use QR Code<br/>Android: Settings → Connections → SIM Manager → Add eSIM (Android can also install from a screenshot — look for "scan from photo" in that same screen)</p>
    </div>

    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Manual entry (if the above doesn't work)</p>
      <p style="margin:0;font-size:12px;font-family:monospace;word-break:break-all;color:#050606;line-height:1.6;">${activationCode}</p>
    </div>

    <div style="text-align:center;margin:28px 0;">
      ${btn('View in account portal', portalUrl)}
    </div>

    ${showIntlNumberNudge ? intlNumberNudge(portalUrl) : ''}
    ${p('Once installed, your eSIM QR will be removed from your portal to keep things tidy. If you need it again, just contact support.')}
    ${p('One important thing: only attempt install once. eSIM codes are single-use — if an attempt seems stuck or fails, don\'t retry the same code, message us instead and we\'ll issue a fresh one.')}
    ${p('Need help installing? <a href="https://wa.me/972555195375" style="color:' + BRAND_COLOR + ';">WhatsApp us</a> and we\'ll walk you through it.')}
  `);
}

// ── Physical SIM shipped email ────────────────────────────────────────────────

export interface SimShippedEmailParams {
  fullName: string;
  planName: string;
  trackingNumber?: string;
  portalUrl: string;
}

export function buildSimShippedEmail(params: SimShippedEmailParams): string {
  const { fullName, planName, trackingNumber, portalUrl } = params;
  const firstName = fullName.split(' ')[0] ?? fullName;

  return layout(`
    ${h1(`Your SIM card is on its way, ${firstName}!`)}
    ${p(`Your <strong>${planName}</strong> SIM card has been shipped.`)}
    ${trackingNumber ? p(`Tracking number: ${mono(trackingNumber)}`) : ''}
    ${p('Once your SIM arrives, insert it into your phone. Your line should activate automatically within a few minutes.')}
    <div style="text-align:center;margin:28px 0;">
      ${btn('Track in account portal', portalUrl)}
    </div>
    ${p('Questions? <a href="https://wa.me/972555195375" style="color:' + BRAND_COLOR + ';">WhatsApp us</a> anytime.')}
  `);
}

// ── Internal admin notifications ──────────────────────────────────────────────

const ADMIN_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitlink.co.il';

function adminRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;width:120px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;font-size:13px;color:#050606;">${value}</td>
  </tr>`;
}

export interface AdminSignupEmailParams {
  fullName: string;
  email: string;
  phone: string;
  orgReferralCode?: string | null;
}

export function buildAdminSignupEmail(params: AdminSignupEmailParams): string {
  const { fullName, email, phone, orgReferralCode } = params;
  const now = new Date().toLocaleString('en-IL', { timeZone: 'Asia/Jerusalem', dateStyle: 'medium', timeStyle: 'short' });
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:16px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;background:#fff;border-radius:16px;padding:28px;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#00A3A3;text-transform:uppercase;letter-spacing:0.08em;">BitLink</p>
    <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#050606;">New signup</h1>
    <table cellpadding="0" cellspacing="0" style="width:100%;">
      ${adminRow('Name', fullName)}
      ${adminRow('Email', `<a href="mailto:${email}" style="color:#00A3A3;">${email}</a>`)}
      ${adminRow('Phone', phone)}
      ${orgReferralCode ? adminRow('Org code', orgReferralCode) : ''}
      ${adminRow('Time', now)}
    </table>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;">
      <a href="${ADMIN_URL}/admin/customers" style="font-size:13px;font-weight:600;color:#00A3A3;text-decoration:none;">Open admin →</a>
    </div>
  </div>
</body></html>`;
}

export interface AdminSaleEmailParams {
  fullName: string;
  email: string;
  planName: string;
  priceCents: number;
  isEsim: boolean;
  orgReferralCode?: string | null;
}

export function buildAdminSaleEmail(params: AdminSaleEmailParams): string {
  const { fullName, email, planName, priceCents, isEsim, orgReferralCode } = params;
  const priceStr = `$${(priceCents / 100).toFixed(2)}/mo`;
  const now = new Date().toLocaleString('en-IL', { timeZone: 'Asia/Jerusalem', dateStyle: 'medium', timeStyle: 'short' });
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:16px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;background:#fff;border-radius:16px;padding:28px;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#00A3A3;text-transform:uppercase;letter-spacing:0.08em;">BitLink</p>
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#050606;">New sale 🎉</h1>
    <p style="margin:0 0 20px;font-size:28px;font-weight:800;color:#050606;">${priceStr}</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;">
      ${adminRow('Customer', fullName)}
      ${adminRow('Email', `<a href="mailto:${email}" style="color:#00A3A3;">${email}</a>`)}
      ${adminRow('Plan', planName)}
      ${adminRow('SIM type', isEsim ? 'eSIM' : 'Physical SIM')}
      ${orgReferralCode ? adminRow('Org code', orgReferralCode) : ''}
      ${adminRow('Time', now)}
    </table>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;">
      <a href="${ADMIN_URL}/admin/customers" style="font-size:13px;font-weight:600;color:#00A3A3;text-decoration:none;">Open admin →</a>
    </div>
  </div>
</body></html>`;
}

// ── Line active (physical SIM / general activation notice) ──────────────────

export function buildLineActiveEmail(params: {
  fullName: string;
  planName: string;
  phoneNumber?: string | null;
  portalUrl: string;
  showIntlNumberNudge?: boolean;
}): string {
  const firstName = params.fullName.split(' ')[0] ?? params.fullName;
  return layout(`
    ${h1(`Your line is active${params.phoneNumber ? ` — ${params.phoneNumber}` : ''}`)}
    ${p(`Hi ${firstName},`)}
    ${p(`Your BitLink <b>${params.planName}</b> line is now active${params.phoneNumber ? ` on ${mono(params.phoneNumber)}` : ''}. Calls, texts, and data are ready to go.`)}
    ${p('You can see your line, usage, and billing anytime in your account:')}
    ${btn('Open my account', params.portalUrl)}
    ${params.showIntlNumberNudge ? intlNumberNudge(params.portalUrl) : ''}
    ${p('Questions? Reply to this email or message us on WhatsApp — a real person answers.')}
  `);
}

// ── Admin-created customer login ─────────────────────────────────────────────

export function buildCustomerLoginCreatedEmail(params: {
  fullName: string;
  email: string;
  password: string;
  loginUrl: string;
}): string {
  const fullName = escapeHtml(params.fullName || 'there');
  const firstName = fullName.split(' ')[0] ?? fullName;
  const email = escapeHtml(params.email);
  const password = escapeHtml(params.password);

  return layout(`
    ${h1(`Your BitLink account is ready, ${firstName}`)}
    ${p('We created your BitLink login so you can manage your lines, activation details, referrals, and billing anytime.')}

    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Login details</p>
      <p style="margin:0 0 8px;font-size:14px;color:#050606;">Email: ${mono(email)}</p>
      <p style="margin:0;font-size:14px;color:#050606;">Password: ${mono(password)}</p>
    </div>

    <div style="text-align:center;margin:28px 0;">
      ${btn('Log in to BitLink', params.loginUrl)}
    </div>

    ${p('For security, you can change this password anytime by using the forgot-password link on the login page.')}
    ${p('Questions? Reply to this email or WhatsApp us at <a href="https://wa.me/972555195375" style="color:' + BRAND_COLOR + ';">+972-55-519-5375</a>.')}
  `);
}

// ── Free topup gift (admin-granted, no charge) ───────────────────────────────

export function buildFreeTopupGiftEmail(params: {
  fullName: string;
  topupLabel: string;
  recurring: boolean;
}): string {
  const fullName = escapeHtml(params.fullName || 'there');
  const firstName = fullName.split(' ')[0] ?? fullName;
  const topupLabel = escapeHtml(params.topupLabel);

  return layout(`
    ${h1(`A little gift from BitLink, ${firstName}!`)}
    ${p(`We appreciate having you with us — so we've added <strong>${topupLabel}</strong> to your line, on the house.`)}
    ${p(
      params.recurring
        ? `This isn&rsquo;t a one-time thing — <strong>${topupLabel}</strong> will keep landing on your line automatically every month, no action needed from you.`
        : `It&rsquo;s already on your line and ready to use.`,
    )}
    <div style="background:#f0fdf4;border-left:3px solid #22c55e;border-radius:0 12px 12px 0;padding:16px 20px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#15803d;font-weight:600;">No charge, nothing to do</p>
      <p style="margin:6px 0 0;font-size:14px;color:#15803d;">This is a gift — it will never appear as a charge on your bill.</p>
    </div>
    ${p('You can check your current data balance anytime in your account.')}
    <div style="text-align:center;margin:28px 0;">
      ${btn('Open my account', `${BASE_URL}/account/lines`)}
    </div>
    ${p('Questions? Reply to this email or WhatsApp us at <a href="https://wa.me/972555195375" style="color:' + BRAND_COLOR + ';">+972-55-519-5375</a>.')}
  `);
}

// ── Sales rep notifications ─────────────────────────────────────────────────

export function buildSalesRepWelcomeEmail(params: {
  fullName: string;
  referralLink: string;
  payoutAmountAgorot: number;
}): string {
  const firstName = escapeHtml(params.fullName.split(' ')[0] ?? params.fullName);
  const payout = formatIls(params.payoutAmountAgorot);
  const referralLink = escapeHtml(params.referralLink);

  return layout(`
    ${h1(`You're now a BitLink Sales Rep, ${firstName}`)}
    ${p(`Your BitLink referral link is live. Share it with anyone who needs an Israeli phone plan.`)}

    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Your referral link</p>
      <p style="margin:0;font-size:13px;line-height:1.6;word-break:break-all;color:#050606;">${referralLink}</p>
    </div>

    ${p(`You earn <strong>${payout}</strong> — 30 shekels — for each qualified referral commission added to your BitLink Sales Rep account.`)}
    ${p('You will get an email each time a new referral commission is added, including the name of the person you referred.')}

    <div style="text-align:center;margin:28px 0;">
      ${btn('Share your referral link', params.referralLink)}
    </div>

    ${p('You can track referrals, commissions, and payments from your BitLink account portal.')}
  `);
}

export function buildSalesRepCommissionEmail(params: {
  fullName: string;
  referredFullName: string;
  amountAgorot: number;
  accountUrl: string;
}): string {
  const firstName = escapeHtml(params.fullName.split(' ')[0] ?? params.fullName);
  const referredFullName = escapeHtml(params.referredFullName);
  const amount = formatIls(params.amountAgorot);

  return layout(`
    ${h1(`New referral commission, ${firstName}`)}
    ${p(`<strong>${referredFullName}</strong> signed up with your BitLink referral link and now has an active line.`)}
    ${p(`We added <strong>${amount}</strong> to your BitLink Sales Rep balance.`)}

    <div style="background:#ecfeff;border-left:3px solid ${BRAND_COLOR};border-radius:0 12px 12px 0;padding:16px 20px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#0f766e;font-weight:700;">Commission added</p>
      <p style="margin:6px 0 0;font-size:14px;color:#0f766e;">This commission is now visible on your account under Referrals.</p>
    </div>

    <div style="text-align:center;margin:28px 0;">
      ${btn('View referrals', params.accountUrl)}
    </div>

    ${p('Thanks for sending people to BitLink.')}
  `);
}

// ── Admin copy: line provisioned (with resend-ready activation details) ─────

export function buildAdminProvisionedEmail(params: {
  fullName: string;
  email: string;
  planName: string;
  phoneNumber?: string | null;
  isEsim: boolean;
  activationCode?: string | null;
  lineId: string;
  adminUrl: string;
}): string {
  const rows = [
    ['Customer', params.fullName],
    ['Email', `<a href="mailto:${params.email}" style="color:${BRAND_COLOR};">${params.email}</a>`],
    ['Plan', params.planName],
    ['Number', params.phoneNumber ?? 'pending'],
    ['SIM type', params.isEsim ? 'eSIM' : 'Physical SIM'],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;font-size:13px;color:#94a3b8;width:110px;">${k}</td><td style="padding:6px 0;font-size:13px;color:#050606;font-weight:600;">${v}</td></tr>`,
    )
    .join('');

  return layout(`
    ${h1(`Line provisioned — ${params.fullName}`)}
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">${rows}</table>
    ${
      params.isEsim && params.activationCode
        ? `${p('<b>eSIM QR</b> — scan to test, or forward to the customer if they lose their email:')}
           <div style="text-align:center;margin:0 0 16px;">
             <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(params.activationCode)}" alt="eSIM QR code" width="200" height="200" style="border-radius:12px;border:1px solid #e2e8f0;" />
           </div>
           <p style="margin:0 0 16px;"><span style="font-family:monospace;background:#f1f5f9;padding:8px 10px;border-radius:8px;font-size:12px;color:#050606;display:inline-block;word-break:break-all;">${params.activationCode}</span></p>`
        : ''
    }
    ${btn('Open line in admin', `${params.adminUrl}/admin/lines/${params.lineId}`)}
  `);
}

// ── Review request (manual, admin-fired) ─────────────────────────────────────
// Sent from the admin customer list AFTER Joe has personally confirmed the
// customer is happy — deliberately not automated while the GBP listing is new.

export function buildReviewRequestEmail(params: {
  fullName: string;
  reviewUrl: string;
}): string {
  const firstName = params.fullName.split(' ')[0] || 'there';
  return layout(`
    ${h1('Thank you for being with BitLink')}
    ${p(`Hi ${firstName},`)}
    ${p("Glad the line's treating you well. One small favor: BitLink is a new company, and honest reviews from real customers are how other families decide to trust us. If you have sixty seconds, it would genuinely help:")}
    ${btn('Leave a Google review', params.reviewUrl)}
    ${p('And if anything ever isn’t right, just reply to this email — a real person answers.')}
  `);
}

// ── Data usage alert (80% / 95%) ──────────────────────────────────────────────
// BitLink has no overage billing — data pauses at the cap. These emails make
// sure that's never a surprise: usage bar, reset date, and self-serve topups.

export function buildDataUsageAlertEmail(params: {
  fullName: string;
  level: "warning" | "critical";
  usedLabel: string;
  allowanceLabel: string;
  percentUsed: number;
  resetDate: Date;
  topupOptions: Array<{ name: string; priceCents: number }>;
  portalUrl: string;
}): string {
  const firstName = params.fullName.split(" ")[0] ?? params.fullName;
  const resetLabel = params.resetDate.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  const barColor = params.level === "critical" ? "#e11d48" : "#d97706";

  const topupRows = params.topupOptions
    .map(
      (t) =>
        `<tr><td style="padding:6px 0;font-size:14px;color:#050606;font-weight:600;">${t.name}</td><td style="padding:6px 0;font-size:14px;color:#475569;text-align:right;">$${(t.priceCents / 100).toFixed(2)}</td></tr>`,
    )
    .join("");

  return layout(`
    ${h1(
      params.level === "critical"
        ? `Your data is almost out, ${firstName}`
        : `Heads up on your data, ${firstName}`,
    )}
    ${p(
      `You've used <strong>${params.usedLabel} of ${params.allowanceLabel}</strong> (${params.percentUsed}%) this month.`,
    )}

    <div style="background:#f1f5f9;border-radius:100px;height:12px;margin:16px 0;overflow:hidden;">
      <div style="background:${barColor};height:12px;width:${Math.min(100, params.percentUsed)}%;border-radius:100px;"></div>
    </div>

    ${p(
      params.level === "critical"
        ? `When you hit your limit, data simply <strong>pauses</strong> until it resets on <strong>${resetLabel}</strong> — you'll never be surprise-billed for overage. To keep going before then, add a topup (it's live within minutes):`
        : `No surprises with BitLink: if you do reach your limit, data simply <strong>pauses</strong> until it resets on <strong>${resetLabel}</strong> — there's no overage billing, ever. If you think you'll need more before then, topups are available any time:`,
    )}

    <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin:20px 0;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">${topupRows}</table>
      <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">Charged to your card on file, live within minutes, valid 30 days.</p>
    </div>

    <div style="text-align:center;margin:24px 0;">
      ${btn("Buy a topup", params.portalUrl)}
    </div>

    ${p('Questions about which plan size fits you? Just reply — a real person answers, in English.')}
  `);
}

// ── First-usage welcome email — sent once a line records its FIRST real
// network usage (a CDR row), not at signup or activation. This is the "you've
// actually landed and started using it" moment, checked on every CDR/FTP
// pull. Deliberately no boilerplate beyond a warm welcome + the WhatsApp
// invite — see lib/welcome-usage-email.ts for the trigger logic.

export function buildFirstUsageWelcomeEmail(params: { fullName: string }): string {
  const firstName = (params.fullName ?? "").trim().split(/\s+/)[0] || "there";

  return layout(`
    ${h1(`Hey ${firstName},`)}
    ${p("Your BitLink line just kicked in, welcome aboard!")}
    ${p("Need anything at all? Question about your plan, want more data, or just want to say hi, message us on WhatsApp anytime. Real people, always happy to help.")}
    <div style="text-align:center;margin:28px 0;">
      ${btn("Message us on WhatsApp", "https://wa.me/972555195375")}
    </div>
    ${p("Glad you're here!")}
  `);
}

// ── Abandoned-checkout recovery email — sent once for a Basic-plan checkout
// session that's been open 2+ hours with no payment. Activation fee is
// waived for 24h from send, to get cold-feet customers back. See
// lib/abandoned-checkout.ts for the trigger/cron logic.

// ── Trial welcome/credentials — sent once, the moment a free trial starts
// (card saved, before the line is even provisioned). This is the only place
// a trial customer gets a way to log in — the separate "eSIM ready" email
// only fires once the line is live, and never includes credentials. Never
// names the trial's backing plan tier — see lib/trial-offer.ts.

export function buildTrialWelcomeEmail(params: {
  fullName: string;
  email: string;
  loginUrl: string;
  tempPassword?: string | null;
}): string {
  const { fullName, email, loginUrl, tempPassword } = params;
  const firstName = (fullName ?? "").trim().split(/\s+/)[0] || "there";

  const credBlock = tempPassword
    ? `<div style="background:#f8fafc;border-radius:12px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Your login credentials</p>
        <p style="margin:0 0 8px;font-size:14px;color:#050606;">Email: ${mono(email)}</p>
        <p style="margin:0;font-size:14px;color:#050606;">Temporary password: ${mono(tempPassword)}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">You'll be prompted to change this on first login.</p>
      </div>`
    : '';

  return layout(`
    ${h1(`Welcome to BitLink, ${firstName}!`)}
    ${p("You're all set — we're setting up your real Israeli eSIM line right now. This is your account login, so keep this email handy.")}
    ${credBlock}
    <div style="text-align:center;margin:28px 0;">
      ${btn('Open your account', loginUrl)}
    </div>
    ${p("Activation usually takes 3–5 minutes. Once your line is live we'll send your eSIM QR code separately, and you'll also see it in your account portal.")}
    ${p('Questions? Reply to this email or WhatsApp us at <a href="https://wa.me/972555195375" style="color:' + BRAND_COLOR + ';">+972-55-519-5375</a>.')}
  `);
}

// ── Trial decision reminder — sent once, ~9 days before a free trial's
// month runs out, pointing to the decision page. Never names the trial's
// backing plan tier — see lib/trial-offer.ts.

export function buildTrialDecisionReminderEmail(params: {
  fullName: string;
  decideUrl: string;
}): string {
  const firstName = (params.fullName ?? "").trim().split(/\s+/)[0] || "there";

  return layout(`
    ${h1(`Hey ${firstName}, your trial's wrapping up soon`)}
    ${p("Your real Israeli eSIM line has been live for a few weeks now, hope it's been useful. In a little over a week your free trial ends, and we want to make sure you don't lose the number.")}
    ${p("Pick a plan now and keep everything running with no gap, no new number, nothing to redo.")}
    <div style="text-align:center;margin:28px 0;">
      ${btn("Pick your plan", params.decideUrl)}
    </div>
    ${p("Heads up: if you don't pick one, we'll automatically continue your line on our Basic plan and charge the card on file — we'll send you one more reminder with the exact date first. Want to cancel instead? You can do that from the same link above.")}
    ${p("Questions? Just reply here or message us on WhatsApp, real people, always happy to help.")}
  `);
}

// ── Trial final warning — sent once, ~2 days before the auto-continue
// charge actually happens. This is the disclosure that makes defaulting to
// a charge fair: nobody should be surprised by it.

export function buildTrialFinalWarningEmail(params: {
  fullName: string;
  chargeDate: string;
  planName: string;
  priceLabel: string;
  decideUrl: string;
}): string {
  const firstName = (params.fullName ?? "").trim().split(/\s+/)[0] || "there";

  return layout(`
    ${h1(`Hey ${firstName}, here's a heads up before we charge you`)}
    ${p(`Your free trial ends soon. Unless you tell us otherwise, on <strong>${escapeHtml(params.chargeDate)}</strong> we'll automatically continue your line on our <strong>${escapeHtml(params.planName)}</strong> plan and charge <strong>${escapeHtml(params.priceLabel)}/month</strong> to the card you gave us at signup.`)}
    ${p("Want to pick a different plan, or cancel instead? Both take one click, no phone call, no hoops.")}
    <div style="text-align:center;margin:28px 0;">
      ${btn("Choose or cancel", params.decideUrl)}
    </div>
    ${p("If you're happy on Basic, you don't need to do anything — this email is just so nothing about your card ever surprises you.")}
    ${p("Questions? Just reply here or message us on WhatsApp, real people, always happy to help.")}
  `);
}

// ── Trial auto-continued confirmation — sent right after the automatic
// day-30 charge succeeds, so the charge is never the first the customer
// hears of it even if they missed both earlier emails.

export function buildTrialAutoContinuedEmail(params: {
  fullName: string;
  planName: string;
  priceLabel: string;
}): string {
  const firstName = (params.fullName ?? "").trim().split(/\s+/)[0] || "there";

  return layout(`
    ${h1(`You're all set, ${firstName}`)}
    ${p(`Your trial ended, so as we told you it would, we continued your line on our <strong>${escapeHtml(params.planName)}</strong> plan and charged <strong>${escapeHtml(params.priceLabel)}</strong> to your card on file. Same number, no interruption.`)}
    <div style="text-align:center;margin:28px 0;">
      ${btn("Manage my plan", `${BASE_URL}/account`)}
    </div>
    ${p("Want to change plans or cancel? You can do that anytime from your account, no penalty, no contract.")}
    ${p("Questions? Just reply here or message us on WhatsApp, real people, always happy to help.")}
  `);
}

// ── Admin trial-signup notification — sent to Joe the moment someone starts
// a free trial (card saved, before the line is even provisioned). Separate
// from the "New sale" admin email — no money changed hands here.

export function buildAdminTrialSignupEmail(params: {
  fullName: string;
  email: string;
  phone: string;
  lineId: string;
}): string {
  return layout(`
    ${h1('New BitLink trial')}
    ${p(`<strong>${escapeHtml(params.fullName)}</strong> just started a free trial. Card saved, nothing charged.`)}
    ${p(`${escapeHtml(params.email)}<br/>${escapeHtml(params.phone)}`)}
    <div style="text-align:center;margin:24px 0;">
      ${btn('Open the line in admin', `${BASE_URL}/admin/lines/${params.lineId}`)}
    </div>
  `);
}

// ── Admin notification — a customer enabled SMS-to-email forwarding
// themselves, from their account. Worth knowing since it's a strong
// retention signal (their bank/Google 2FA now depends on the number).

export function buildAdminSmsForwarderEnabledEmail(params: {
  customerName: string;
  customerEmail: string;
  forwardTo: string;
  lineId: string;
}): string {
  return layout(`
    ${h1('SMS-to-email enabled')}
    ${p(`<strong>${escapeHtml(params.customerName)}</strong> just turned on SMS-to-email forwarding from their account.`)}
    ${p(`${escapeHtml(params.customerEmail)}<br/>Forwarding to: ${escapeHtml(params.forwardTo)}`)}
    <div style="text-align:center;margin:24px 0;">
      ${btn('Open the line in admin', `${BASE_URL}/admin/lines/${params.lineId}`)}
    </div>
  `);
}

// `feeAlreadyWaived` distinguishes a real concession from a plan feature.
// Student 5G and Max 5G never charge the activation fee (see
// ACTIVATION_FEE_WAIVED_PLANS), so telling those customers we'll "waive it for
// 24 hours" would promise a discount their price doesn't move by — and the
// first thing an abandoning customer does is compare the new total to the one
// they walked away from. Said plainly as a fact about the plan, it's true and
// still worth saying.
export function buildAbandonedCheckoutRecoveryEmail(params: {
  fullName: string;
  planName: string;
  recoverUrl: string;
  feeAlreadyWaived?: boolean;
}): string {
  const firstName = (params.fullName ?? "").trim().split(/\s+/)[0] || "there";
  const offerLine = params.feeAlreadyWaived
    ? `There's no $14.99 activation fee on ${escapeHtml(params.planName)} — you'll just pay for your first month to get started.`
    : "Come back in the next 24 hours and we'll waive your $14.99 activation fee, so you'll just pay for your first month to get started.";

  return layout(`
    ${h1("Your Israeli number is waiting")}
    ${p(`Hey ${firstName}, looks like you got right to the checkout page for your ${escapeHtml(params.planName)} plan and didn't finish. No problem, it happens.`)}
    ${p(offerLine)}
    <div style="text-align:center;margin:28px 0;">
      ${btn("Finish signing up", params.recoverUrl)}
    </div>
    ${p("Any questions first? Just reply to this email or message us on WhatsApp, real people, always happy to help.")}
    <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #f1f5f9;font-size:12px;line-height:1.6;color:#94a3b8;">
      By the way: if it's ever not for you, just message us within 3 days of purchase and ask to cancel, we'll refund you in full, no questions asked.
    </p>
  `);
}

// ── BitLink Rep: a trial they sent just converted ─────────────────────────────
//
// The payout is a ONE-TIME commission on that conversion, not a recurring cut
// of the customer's monthly bill. The copy has to be unambiguous about that —
// a Rep who thinks they're earning monthly will feel cheated the second month.

export function buildRepConversionEmail(params: {
  repName: string;
  customerName: string;
  planName: string;
  payoutCents: number;
  liveTrials: number;
  monthConversions: number;
  monthEarnedCents: number;
  monthLabel: string;
}): string {
  const firstName = (params.repName ?? "").trim().split(/\s+/)[0] || "there";
  const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const row = (label: string, value: string) =>
    `<tr>
       <td style="padding:7px 0;font-size:14px;color:#94a3b8;">${label}</td>
       <td style="padding:7px 0;font-size:14px;font-weight:700;color:#050606;text-align:right;">${value}</td>
     </tr>`;

  return layout(`
    ${h1(`Nice one, ${escapeHtml(firstName)} — that's a conversion 🎉`)}
    ${p("Someone who started a free trial on your link just kept their plan. That means you've earned a commission.")}

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:18px 20px;margin:0 0 20px;">
      <table style="width:100%;border-collapse:collapse;">
        ${row("Customer", escapeHtml(params.customerName))}
        ${row("Plan they chose", escapeHtml(params.planName))}
        ${row("You earned", money(params.payoutCents))}
      </table>
    </div>

    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">
      Where you're at
    </p>
    <div style="background:#f8fafc;border-radius:12px;padding:18px 20px;margin:0 0 20px;">
      <table style="width:100%;border-collapse:collapse;">
        ${row("Trials currently running on your link", String(params.liveTrials))}
        ${row(`Conversions in ${escapeHtml(params.monthLabel)}`, String(params.monthConversions))}
        ${row(`Earned in ${escapeHtml(params.monthLabel)}`, money(params.monthEarnedCents))}
      </table>
    </div>

    ${p(`Those ${params.liveTrials} live trial${params.liveTrials === 1 ? "" : "s"} haven't earned anything yet — each one pays out only if they keep their plan when their free month ends.`)}

    <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #f1f5f9;font-size:12px;line-height:1.6;color:#94a3b8;">
      Just so it's clear: each commission is a one-time payment for that conversion, not a monthly share of what the
      customer pays. You earn once per person who keeps their plan. Questions, or want to change how you're paid?
      Just reply to this email.
    </p>
  `);
}

// ── Past-due notice — a renewal charge was declined and the invoice is still
// open. Deliberately does NOT name a suspension deadline: the dunning policy
// isn't live yet, and announcing a date we don't yet enforce is worse than
// saying nothing. It also states plainly that the line still works, because
// the first thing someone fears on reading this is that they've been cut off.

export function buildPastDueEmail(params: {
  fullName: string;
  amountLabel: string;
  dueDateLabel: string;
  payUrl: string;
}): string {
  const firstName = (params.fullName ?? "").trim().split(/\s+/)[0] || "there";

  return layout(`
    ${h1(`Hey ${firstName}, your last payment didn't go through`)}
    ${p(`We tried to charge <strong>${escapeHtml(params.amountLabel)}</strong> for your monthly BitLink plan on <strong>${escapeHtml(params.dueDateLabel)}</strong>, and your bank declined it. It happens — usually it's a card that expired, a temporary hold, or a balance that was short on the day.`)}
    ${p("Your line is still working normally in the meantime. Nothing has changed with your number.")}
    <div style="text-align:center;margin:28px 0;">
      ${btn("Pay now", params.payUrl)}
    </div>
    ${p(`That link settles the outstanding amount in one step. If the card itself is the problem, you can swap it from <a href="${BASE_URL}/account/billing" style="color:${BRAND_COLOR};text-decoration:none;font-weight:600;">your billing page</a> and we'll retry automatically.`)}
    ${p("Already paid, or think this reached you by mistake? Just reply to this email and we'll sort it out.")}
    ${p("Questions? Reply here or message us on WhatsApp, real people, always happy to help.")}
  `);
}
