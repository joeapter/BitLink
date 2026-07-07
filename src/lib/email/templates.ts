// Email HTML templates for BitLink transactional emails.
// Plain HTML — no React Email dependency needed.

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
            <span style="font-size:24px;font-weight:800;color:#050606;letter-spacing:-0.5px;">Bit<span style="color:${BRAND_COLOR};">L</span>ink</span>
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
    ${p('Questions? Reply to this email or WhatsApp us at <a href="https://wa.me/972587939426" style="color:' + BRAND_COLOR + ';">+972-58-793-9426</a>.')}
  `);
}

// ── eSIM ready email — sent when Annatel line is ACTIVE ───────────────────────

export interface EsimReadyEmailParams {
  fullName: string;
  activationCode: string;   // LPA string: LPA:1$smdp.address$token
  planName: string;
  portalUrl: string;
}

export function buildEsimReadyEmail(params: EsimReadyEmailParams): string {
  const { fullName, activationCode, planName, portalUrl } = params;
  const firstName = fullName.split(' ')[0] ?? fullName;

  // QR code image via qrserver.com — no npm package needed
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(activationCode)}`;

  return layout(`
    ${h1(`Your eSIM is ready, ${firstName}!`)}
    ${p(`Your <strong>${planName}</strong> line is active. Install your eSIM now to start making and receiving calls in Israel.`)}

    <div style="text-align:center;margin:28px 0;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#050606;">Scan this QR code with your phone</p>
      <img src="${qrUrl}" alt="eSIM QR Code" width="220" height="220" style="border-radius:12px;border:1px solid #e2e8f0;" />
      <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">iOS: Settings → Mobile → Add eSIM → Use QR Code<br/>Android: Settings → Connections → SIM Manager → Add eSIM</p>
    </div>

    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Manual entry (if QR doesn't work)</p>
      <p style="margin:0;font-size:12px;font-family:monospace;word-break:break-all;color:#050606;line-height:1.6;">${activationCode}</p>
    </div>

    <div style="text-align:center;margin:28px 0;">
      ${btn('View in account portal', portalUrl)}
    </div>

    ${p('Once installed, your eSIM QR will be removed from your portal to keep things tidy. If you need it again, just contact support.')}
    ${p('Need help installing? <a href="https://wa.me/972587939426" style="color:' + BRAND_COLOR + ';">WhatsApp us</a> and we\'ll walk you through it.')}
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
    ${p('Questions? <a href="https://wa.me/972587939426" style="color:' + BRAND_COLOR + ';">WhatsApp us</a> anytime.')}
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
}): string {
  const firstName = params.fullName.split(' ')[0] ?? params.fullName;
  return layout(`
    ${h1(`Your line is active${params.phoneNumber ? ` — ${params.phoneNumber}` : ''}`)}
    ${p(`Hi ${firstName},`)}
    ${p(`Your BitLink <b>${params.planName}</b> line is now active${params.phoneNumber ? ` on ${mono(params.phoneNumber)}` : ''}. Calls, texts, and data are ready to go.`)}
    ${p('You can see your line, usage, and billing anytime in your account:')}
    ${btn('Open my account', params.portalUrl)}
    ${p('Questions? Reply to this email or message us on WhatsApp — a real person answers.')}
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
        ? `${p('<b>eSIM activation code</b> (forward to the customer if they lose their email):')}
           <p style="margin:0 0 16px;"><span style="font-family:monospace;background:#f1f5f9;padding:8px 10px;border-radius:8px;font-size:12px;color:#050606;display:inline-block;word-break:break-all;">${params.activationCode}</span></p>`
        : ''
    }
    ${btn('Open line in admin', `${params.adminUrl}/admin/lines/${params.lineId}`)}
  `);
}
