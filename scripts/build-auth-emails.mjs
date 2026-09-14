// Builds the branded Supabase Auth email templates into supabase/templates/.
//
//   npm run emails:auth
//
// Supabase Auth emails are rendered by GoTrue, not by our Next.js app, so they
// can't reuse src/lib/email/templates.ts at runtime. This script keeps the two
// in sync at build time instead: the layout below is a deliberate mirror of
// layout() in that file, so auth mail and transactional mail look identical.
//
// The generated files are committed. Apply them with `supabase config push`
// (they're wired up under [auth.email.template.*] in supabase/config.toml), or
// paste them into Authentication → Emails in the dashboard.
//
// Go template variables available to GoTrue: .ConfirmationURL .Token .TokenHash
// .SiteURL .Email .NewEmail .RedirectTo .Data

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'supabase', 'templates');

const BRAND_COLOR = '#00A3A3';
const BASE_URL = 'https://bitlink.co.il';

// 30KB, renders at 160x53. Not logo-v2.png — that one is 2172px wide and just
// over 1MB, which Gmail is slow to proxy and some clients refuse outright.
const LOGO_URL = `${BASE_URL}/assets/logo-email.png`;

// Mirrors supabase/config.toml: otp_expiry = 3600, otp_length = 8.
const OTP_EXPIRY_TEXT = '1 hour';

// GoTrue verifies these server-side at /auth/confirm, so the link the customer
// sees is on our own domain. {{ .ConfirmationURL }} would expose a
// <project>.supabase.co/auth/v1/verify?... URL instead — off-brand, and more
// likely to be pre-fetched (and thus burned) by corporate link scanners.
function confirmUrl(type, next) {
  const suffix = next ? `&amp;next=${next}` : '';
  return `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=${type}${suffix}`;
}

function layout({ preheader, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BitLink</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Logo / header -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <a href="${BASE_URL}" style="text-decoration:none;">
            <img src="${LOGO_URL}" alt="BitLink" width="160" height="53" style="display:inline-block;width:160px;height:53px;" />
          </a>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:20px;padding:40px;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
${body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;font-size:12px;color:#94a3b8;">
          BitLink &middot; Business ID 341280188 &middot; HaRashar Hirsch 4/1, Israel<br/>
          <a href="${BASE_URL}" style="color:${BRAND_COLOR};text-decoration:none;">bitlink.co.il</a>
          &nbsp;&middot;&nbsp;
          <a href="mailto:support@bitlink.co.il" style="color:${BRAND_COLOR};text-decoration:none;">support@bitlink.co.il</a>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;
}

function h1(text) {
  return `          <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#050606;line-height:1.2;">${text}</h1>`;
}

function p(text) {
  return `          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">${text}</p>`;
}

function btn(text, href) {
  return `          <div style="text-align:center;margin:28px 0;">
            <a href="${href}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:100px;text-decoration:none;">${text}</a>
          </div>`;
}

// Some corporate mail clients strip or rewrite buttons. The raw URL is the
// fallback that always survives.
function rawLink(href) {
  return `          <p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#94a3b8;">
            Button not working? Copy and paste this link into your browser:<br/>
            <a href="${href}" style="color:${BRAND_COLOR};text-decoration:none;word-break:break-all;">${href}</a>
          </p>`;
}

function codeBlock(label) {
  return `          <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">${label}</p>
            <p style="margin:0;font-family:monospace;font-size:28px;font-weight:700;letter-spacing:0.15em;color:#050606;">{{ .Token }}</p>
          </div>`;
}

function expiryNote(extra) {
  return `          <p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #e2e8f0;font-size:13px;line-height:1.6;color:#94a3b8;">
            This ${extra.thing} expires in ${OTP_EXPIRY_TEXT} and can only be used once. ${extra.ignore}
          </p>`;
}

const IGNORE_GENERIC =
  'If you didn’t request it, you can safely ignore this email — nothing will change.';

const templates = {
  confirmation: {
    subject: 'Confirm your email to activate your BitLink account',
    preheader: 'One tap to confirm your email and finish setting up your BitLink account.',
    build() {
      const url = confirmUrl('signup', '/account');
      return layout({
        preheader: this.preheader,
        body: [
          h1('Confirm your email'),
          p('Thanks for creating a BitLink account. Confirm this address and your account is ready to use.'),
          btn('Confirm my email', url),
          rawLink(url),
          expiryNote({
            thing: 'link',
            ignore: 'If you didn’t create a BitLink account, you can safely ignore this email.',
          }),
        ].join('\n'),
      });
    },
  },

  invite: {
    subject: 'You’ve been invited to BitLink',
    preheader: 'Accept your invitation and set a password for your BitLink account.',
    build() {
      // Invited users have no password yet, so land them on /reset-password to
      // set one rather than dropping them into /account half-configured.
      const url = confirmUrl('invite', '/reset-password');
      return layout({
        preheader: this.preheader,
        body: [
          h1('You’ve been invited'),
          p('You’ve been invited to create a BitLink account for <strong>{{ .Email }}</strong>. Accept the invitation below and choose a password.'),
          btn('Accept invitation', url),
          rawLink(url),
          expiryNote({
            thing: 'invitation',
            ignore: 'If you weren’t expecting this, you can safely ignore this email.',
          }),
        ].join('\n'),
      });
    },
  },

  magic_link: {
    subject: 'Your BitLink sign-in link',
    preheader: 'Your single-use link to sign in to BitLink.',
    build() {
      const url = confirmUrl('magiclink', '/account');
      return layout({
        preheader: this.preheader,
        body: [
          h1('Sign in to BitLink'),
          p('Tap below to sign in to your account. No password needed.'),
          btn('Sign in', url),
          rawLink(url),
          expiryNote({ thing: 'link', ignore: IGNORE_GENERIC }),
        ].join('\n'),
      });
    },
  },

  email_change: {
    subject: 'Confirm your new BitLink email address',
    preheader: 'Confirm the change to your BitLink account email address.',
    build() {
      const url = confirmUrl('email_change', '/account');
      return layout({
        preheader: this.preheader,
        body: [
          h1('Confirm your new address'),
          p('We received a request to change the email address on your BitLink account from <strong>{{ .Email }}</strong> to <strong>{{ .NewEmail }}</strong>.'),
          // double_confirm_changes = true in config.toml, so this same mail goes
          // to the old and new address and both must be confirmed.
          p('For your security, this needs to be confirmed from <strong>both</strong> addresses. This email has been sent to each of them.'),
          btn('Confirm this change', url),
          rawLink(url),
          expiryNote({
            thing: 'link',
            ignore: 'If you didn’t request this change, ignore this email and contact us at support@bitlink.co.il — your address stays as it is.',
          }),
        ].join('\n'),
      });
    },
  },

  recovery: {
    subject: 'Reset your BitLink password',
    preheader: 'Choose a new password for your BitLink account.',
    build() {
      const url = confirmUrl('recovery', '/reset-password');
      return layout({
        preheader: this.preheader,
        body: [
          h1('Reset your password'),
          p('We received a request to reset the password for <strong>{{ .Email }}</strong>. Choose a new one below.'),
          btn('Choose a new password', url),
          rawLink(url),
          expiryNote({
            thing: 'link',
            ignore: 'If you didn’t request a reset, you can safely ignore this email — your password won’t change.',
          }),
        ].join('\n'),
      });
    },
  },

  // Reauthentication is the one template with no link: GoTrue only exposes
  // {{ .Token }} here.
  reauthentication: {
    subject: 'Your BitLink confirmation code',
    preheader: 'Your BitLink confirmation code.',
    build() {
      return layout({
        preheader: this.preheader,
        body: [
          h1('Confirm it’s you'),
          p('Enter this code to confirm the change you just requested.'),
          codeBlock('Your confirmation code'),
          expiryNote({ thing: 'code', ignore: IGNORE_GENERIC }),
        ].join('\n'),
      });
    },
  },
};

mkdirSync(OUT_DIR, { recursive: true });

for (const [name, template] of Object.entries(templates)) {
  const file = join(OUT_DIR, `${name}.html`);
  writeFileSync(file, template.build(), 'utf8');
  console.log(`  ${name.padEnd(16)} ${template.subject}`);
}

console.log(`\nWrote ${Object.keys(templates).length} templates to supabase/templates/`);
