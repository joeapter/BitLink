import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description: "BitLink privacy policy for account, telecom, billing, activation, support, and website data.",
  path: "/legal/privacy",
});

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-2xl font-semibold tracking-normal text-ink">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 leading-7 text-slate-700">{children}</p>;
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mt-4 list-disc space-y-3 pl-6 leading-7 text-slate-700">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <article className="mx-auto max-w-3xl text-sm">
        <p className="text-sm font-semibold text-link-blue">BitLink legal</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-normal text-ink">Privacy Policy</h1>
        <p className="mt-4 text-sm font-medium text-muted-slate">Last updated: June 16, 2026</p>

        <div className="mt-8 rounded-[2rem] border border-ink/10 bg-slate-50 p-6 leading-7 text-slate-700">
          <p>
            This Privacy Policy explains how BitLink Ltd. collects, uses, stores, shares, and protects personal
            information when you use our website, create an account, choose a telecom plan, request activation,
            contact support, or otherwise interact with BitLink.
          </p>
          <p className="mt-4">
            For privacy questions or requests, contact us at{" "}
            <a href="mailto:support@bitlink.co.il" className="font-semibold text-link-blue">
              support@bitlink.co.il
            </a>
            , by WhatsApp at{" "}
            <a href="https://wa.me/972587939426" className="font-semibold text-link-blue">
              +972-58-793-9426
            </a>
            , or by phone from Israel at{" "}
            <a href="tel:+972587939426" className="font-semibold text-link-blue">
              058-793-9426
            </a>
            .
          </p>
        </div>

        <H2>1. Who controls your information</H2>
        <P>
          BitLink Ltd. is responsible for the personal information we collect and use for our website, customer
          accounts, plan sales, billing, support, referrals, and telecom activation workflows. Some services are
          provided with telecom, payment, hosting, authentication, email, messaging, analytics, and support vendors
          that process information for us or with us as described below.
        </P>

        <H2>2. Information we collect</H2>
        <List
          items={[
            <>
              <strong>Identity and contact information:</strong> name, email address, phone number, WhatsApp number,
              account initials, support contact details, and any delivery or billing contact information you provide.
            </>,
            <>
              <strong>Account and login information:</strong> authentication identifiers, account status, confirmation
              status, profile role, login events, and security-related account records. We do not store your raw
              password.
            </>,
            <>
              <strong>Plan, order, and billing information:</strong> selected plan, checkout status, subscription
              status, invoice and payment status, Stripe customer or checkout identifiers, transaction references, and
              limited payment details such as card brand or last four digits where provided by our payment processor.
              We do not store full card numbers.
            </>,
            <>
              <strong>Telecom activation and service information:</strong> phone number, SIM or eSIM identifiers,
              activation status, portability or number-transfer details, provisioning events, line status, service
              plan, and related records needed to activate, support, bill, and manage the service.
            </>,
            <>
              <strong>Support and communications:</strong> messages you send us, ticket history, call or WhatsApp
              context, responses, preferences, and records needed to resolve service, billing, activation, or account
              issues.
            </>,
            <>
              <strong>Referral information:</strong> referral code, referral link, referred-by details, reward status,
              and activation status needed to operate the referral program.
            </>,
            <>
              <strong>Website and technical information:</strong> IP address, device and browser details, pages viewed,
              approximate location inferred from network data, cookies or similar technologies, security logs, and
              diagnostic information.
            </>,
            <>
              <strong>Information required for compliance or fraud prevention:</strong> identifiers, documents, or
              additional verification details where reasonably needed to comply with law, telecom obligations, payment
              rules, fraud prevention, network security, or customer protection requirements.
            </>,
          ]}
        />

        <H2>3. Why we use personal information</H2>
        <List
          items={[
            "To create, confirm, secure, and manage your BitLink account.",
            "To process plan selection, checkout, subscription, invoices, refunds, and payment-related support.",
            "To activate, provision, port, suspend, reconnect, cancel, and support telecom services.",
            "To provide customer service by email, phone, WhatsApp, website forms, and account tools.",
            "To send operational messages, including account confirmation, service updates, billing notices, activation updates, security notices, usage alerts, and support responses.",
            "To operate referrals, promotions, plan eligibility, and customer benefits.",
            "To prevent fraud, misuse, identity theft, payment abuse, unauthorized access, and harm to our systems, customers, partners, or network.",
            "To maintain service quality, troubleshoot errors, debug systems, improve the website, and understand how the service is used.",
            "To comply with legal, tax, accounting, telecom, consumer protection, privacy, security, and regulatory obligations.",
            "To send marketing communications only where permitted by law and with required consent or another lawful basis, and always with an unsubscribe or opt-out option where required.",
          ]}
        />

        <H2>4. Consent, required information, and consequences of refusal</H2>
        <P>
          By submitting information to BitLink, creating an account, selecting a plan, contacting support, or using our
          services, you consent to the collection and use of your information for the purposes described in this policy
          and in any notice shown at the point of collection.
        </P>
        <P>
          You are generally not legally required to provide personal information to BitLink. However, some information is
          required to create an account, process payment, activate telecom service, provide customer support, comply with
          telecom or legal obligations, prevent fraud, and manage billing. If you do not provide required information, we
          may be unable to provide all or part of the requested service.
        </P>
        <P>
          If we need to use your personal information for a materially different purpose, we will provide additional
          notice and request renewed consent where required by applicable law.
        </P>

        <H2>5. Who receives personal information</H2>
        <P>We share personal information only as needed for the purposes described in this policy, including with:</P>
        <List
          items={[
            "Telecom network, SIM, eSIM, portability, provisioning, and service partners that help activate and operate your line.",
            "Payment processors, banks, card networks, accounting providers, and billing systems used to process payments and maintain financial records.",
            "Hosting, database, authentication, cloud, email, messaging, support, analytics, security, logging, and infrastructure providers.",
            "Professional advisers, auditors, insurers, legal counsel, and service providers acting for BitLink.",
            "Regulators, courts, law enforcement, telecom authorities, tax authorities, consumer protection bodies, or other third parties where disclosure is required or permitted by law.",
            "Another company in connection with a merger, financing, acquisition, reorganization, sale of assets, or similar business transaction, subject to appropriate protections.",
          ]}
        />
        <P>
          We do not sell your personal information. We also do not allow service providers to use your personal
          information for their own unrelated marketing.
        </P>

        <H2>6. International transfers</H2>
        <P>
          BitLink is based in Israel, but some vendors and infrastructure providers may process or store information in
          Israel, the United States, the European Economic Area, the United Kingdom, or other countries. When personal
          information is transferred outside Israel, we use contractual, organizational, and technical safeguards
          intended to protect the information and to meet applicable Israeli requirements for transfers to databases
          abroad.
        </P>

        <H2>7. Cookies and similar technologies</H2>
        <P>
          We may use cookies, pixels, local storage, and similar technologies for site operation, account sessions,
          security, preferences, analytics, performance, and marketing measurement. You can control cookies through your
          browser settings. Some cookies are necessary for login, checkout, security, and account features and disabling
          them may affect the site.
        </P>

        <H2>8. Marketing communications</H2>
        <P>
          We may send marketing messages about BitLink plans, offers, referrals, or updates where permitted by law. Where
          consent is required, we will ask for it before sending marketing by email, SMS, WhatsApp, automated calls, or
          similar channels. You can opt out of marketing messages by using the unsubscribe instructions in the message or
          by contacting us. Operational service messages are not marketing and may continue while you use the service.
        </P>

        <H2>9. Security</H2>
        <P>
          We use administrative, technical, and organizational safeguards designed to protect personal information,
          including access controls, role-based permissions, encryption in transit where appropriate, provider security
          controls, logging, monitoring, and internal handling limits. No system is completely secure, so we cannot
          guarantee absolute security.
        </P>
        <P>
          If we identify a security incident involving personal information, we will investigate and take appropriate
          steps. Where required, we will notify the Israel Privacy Protection Authority and/or affected individuals.
        </P>

        <H2>10. Retention</H2>
        <P>
          We keep personal information for as long as reasonably needed for the purposes described in this policy,
          including account management, telecom service, billing, support, legal compliance, tax and accounting records,
          dispute handling, fraud prevention, security, and regulatory obligations. When information is no longer needed,
          we will delete, anonymize, or restrict it where reasonably possible and legally appropriate.
        </P>

        <H2>11. Your privacy rights</H2>
        <P>
          Subject to applicable law, you may request access to personal information about you that is held in a BitLink
          database, and you may request correction of information that is inaccurate, incomplete, unclear, or outdated.
          You may also ask us to delete, restrict, or stop using certain information where applicable law requires or
          permits it.
        </P>
        <P>
          To make a request, contact{" "}
          <a href="mailto:support@bitlink.co.il" className="font-semibold text-link-blue">
            support@bitlink.co.il
          </a>
          . We may need to verify your identity before fulfilling a request. If we cannot fulfill a request, we will
          explain the reason where required by law.
        </P>

        <H2>12. Telecom privacy</H2>
        <P>
          We do not listen to your calls or read your message content as part of ordinary service operation. We may
          process telecom service records, activation events, billing records, usage-related records, support
          communications, and network or fraud-prevention information as needed to provide and support the service, bill
          correctly, meet legal obligations, protect customers, and handle disputes.
        </P>

        <H2>13. Children</H2>
        <P>
          BitLink services are intended for adults or for use under the responsibility of a parent or legal guardian. If
          you believe a minor provided personal information without appropriate authorization, contact us and we will
          review the request.
        </P>

        <H2>14. Third-party sites and services</H2>
        <P>
          Our website may link to third-party sites, payment pages, apps, or services. Their privacy practices are
          governed by their own policies. You should review those policies before providing information to them.
        </P>

        <H2>15. Database registration and notices</H2>
        <P>
          BitLink maintains computerized records for customer account, telecom, billing, support, referral, and security
          purposes. If any BitLink database becomes subject to registration, notification, data-protection-officer, or
          similar filing obligations under applicable Israeli privacy law, BitLink will make the required filing or
          appointment.
        </P>

        <H2>16. Changes to this policy</H2>
        <P>
          We may update this policy from time to time. The updated version will be posted on this page with a new
          effective date. If changes are material, we will provide additional notice where required by law.
        </P>

        <div className="mt-10 rounded-[2rem] border border-ink/10 bg-slate-50 p-6 leading-7 text-slate-700">
          <p className="font-semibold text-ink">Contact</p>
          <p className="mt-2">
            Email:{" "}
            <a href="mailto:support@bitlink.co.il" className="font-semibold text-link-blue">
              support@bitlink.co.il
            </a>
          </p>
          <p>
            WhatsApp:{" "}
            <a href="https://wa.me/972587939426" className="font-semibold text-link-blue">
              +972-58-793-9426
            </a>
          </p>
          <p>
            Website:{" "}
            <Link href="/" className="font-semibold text-link-blue">
              www.bitlink.co.il
            </Link>
          </p>
        </div>
      </article>
    </section>
  );
}
