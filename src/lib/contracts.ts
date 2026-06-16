import type { PlanSlug } from "./plans";

export type ContractData = {
  activationTime: string;
  commitment: string;
  simFee: string;
  monthlyAlone: string;
  includedFromIsrael: {
    calls: string;
    sms: string | null;
    data: string | null;
  };
  includedRoaming: {
    data: string | null;
    calls: string | null;
  } | null;
  otherServices: string[];
  notIncluded: Array<{ item: string; rate: string }>;
  notes: string[];
};

export const contractData: Record<PlanSlug, ContractData> = {
  basic: {
    activationTime: "Within 24 hours of payment",
    commitment: "None — cancel anytime",
    simFee: "$0 — eSIM (instant delivery)",
    monthlyAlone: "$14.99 / month",
    includedFromIsrael: {
      calls: "1,000 minutes to Israeli landlines and mobiles",
      sms: "500 SMS to Israeli mobiles",
      data: "1GB high-speed 5G data (blocked after full usage)",
    },
    includedRoaming: null,
    otherServices: ["eSIM — instant digital activation", "WhatsApp support"],
    notIncluded: [
      { item: "Calls beyond 1,000 included minutes", rate: "Blocked" },
      { item: "Data beyond 1GB", rate: "Blocked" },
      { item: "International calls", rate: "Not included" },
      { item: "Roaming data/calls", rate: "Not included" },
    ],
    notes: [
      "Data is blocked after full usage — no overage charges apply.",
      "Prices include VAT where applicable.",
      "No contract or commitment period. Service renews monthly.",
    ],
  },
  "student-5g": {
    activationTime: "Within 24 hours of payment",
    commitment: "None — cancel anytime",
    simFee: "$0 — eSIM (instant delivery)",
    monthlyAlone: "$34.99 / month",
    includedFromIsrael: {
      calls: "5,000 minutes to Israeli landlines and mobiles",
      sms: "1,000 SMS to Israeli mobiles",
      data: "50GB high-speed 5G data (blocked after full usage)",
    },
    includedRoaming: null,
    otherServices: [
      "eSIM — instant digital activation",
      "WhatsApp support",
      "Optional: US/Canada local number add-on (+$9.99/mo)",
    ],
    notIncluded: [
      { item: "Calls beyond 5,000 included minutes", rate: "Blocked" },
      { item: "Data beyond 50GB", rate: "Blocked" },
      { item: "International calls beyond included destinations", rate: "Not included" },
      { item: "Roaming data/calls", rate: "Not included" },
    ],
    notes: [
      "Data is blocked after full usage — no overage charges apply.",
      "Prices include VAT where applicable.",
      "No contract or commitment period. Service renews monthly.",
      "Additional data available as a top-up through your BitLink account.",
    ],
  },
  "max-5g": {
    activationTime: "Within 24 hours of payment",
    commitment: "None — cancel anytime",
    simFee: "$0 — eSIM (instant delivery)",
    monthlyAlone: "$39.99 / month",
    includedFromIsrael: {
      calls: "5,000 minutes to Israeli landlines and mobiles, including 150 minutes to US and Canadian numbers",
      sms: "1,000 SMS to Israeli mobiles",
      data: "120GB high-speed 5G data (blocked after full usage)",
    },
    includedRoaming: null,
    otherServices: [
      "eSIM — instant digital activation",
      "Priority WhatsApp support",
      "Optional: US/Canada local number add-on (+$9.99/mo)",
    ],
    notIncluded: [
      { item: "Calls beyond 5,000 included minutes", rate: "Blocked" },
      { item: "USA/CA calls beyond 150 included minutes", rate: "Blocked" },
      { item: "Data beyond 120GB", rate: "Blocked" },
      { item: "Roaming data/calls", rate: "Not included" },
    ],
    notes: [
      "Data is blocked after full usage — no overage charges apply.",
      "Prices include VAT where applicable.",
      "No contract or commitment period. Service renews monthly.",
      "Additional data available as a top-up through your BitLink account.",
    ],
  },
  "kosher-basic": {
    activationTime: "Within 3–5 business days (physical SIM shipping)",
    commitment: "None — cancel anytime",
    simFee: "Physical SIM card — fee may apply",
    monthlyAlone: "$19.99 / month",
    includedFromIsrael: {
      calls: "5,000 minutes to Israeli landlines and mobiles",
      sms: null,
      data: null,
    },
    includedRoaming: null,
    otherServices: [
      "Kosher-certified phone number",
      "Compatible with certified kosher devices only",
      "Optional: US/Canada local number add-on (+$9.99/mo)",
    ],
    notIncluded: [
      { item: "Calls beyond 5,000 included minutes", rate: "Blocked" },
      { item: "SMS", rate: "Not included" },
      { item: "Mobile data", rate: "Not included" },
      { item: "International calls", rate: "Not included" },
      { item: "Roaming", rate: "Not included" },
    ],
    notes: [
      "This plan is compatible with certified kosher phones only.",
      "Voice only — no data or SMS service is included.",
      "Calls are blocked after full usage — no overage charges apply.",
      "Prices include VAT where applicable.",
      "No contract or commitment period. Service renews monthly.",
    ],
  },
  "kosher-plus": {
    activationTime: "Within 3–5 business days (physical SIM shipping)",
    commitment: "None — cancel anytime",
    simFee: "Physical SIM card — fee may apply",
    monthlyAlone: "$24.99 / month",
    includedFromIsrael: {
      calls: "5,000 minutes to Israeli landlines and mobiles, including 150 minutes to US and Canadian numbers",
      sms: null,
      data: null,
    },
    includedRoaming: null,
    otherServices: [
      "Kosher-certified phone number",
      "Compatible with certified kosher devices only",
      "Optional: US/Canada local number add-on (+$9.99/mo)",
    ],
    notIncluded: [
      { item: "Calls beyond 5,000 included minutes", rate: "Blocked" },
      { item: "USA/CA calls beyond 150 included minutes", rate: "Blocked" },
      { item: "SMS", rate: "Not included" },
      { item: "Mobile data", rate: "Not included" },
      { item: "Roaming", rate: "Not included" },
    ],
    notes: [
      "This plan is compatible with certified kosher phones only.",
      "Voice only — no data or SMS service is included.",
      "Calls are blocked after full usage — no overage charges apply.",
      "Prices include VAT where applicable.",
      "No contract or commitment period. Service renews monthly.",
    ],
  },
};
