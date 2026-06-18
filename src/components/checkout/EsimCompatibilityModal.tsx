"use client";

import { useState } from "react";
import { X, Smartphone } from "lucide-react";

const ESIM_DEVICES: { brand: string; models: string[] }[] = [
  {
    brand: "Apple",
    models: [
      "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
      "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
      "iPhone 13", "iPhone 13 Mini", "iPhone 13 Pro", "iPhone 13 Pro Max",
      "iPhone 12", "iPhone 12 Mini", "iPhone 12 Pro", "iPhone 12 Pro Max",
      "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
      "iPhone XS", "iPhone XS Max", "iPhone XR",
      "iPhone SE (2020)", "iPhone SE (2022)",
      "iPad Air (3rd–5th generation)",
      "iPad Pro 11-inch (1st–3rd generation)",
      "iPad Pro 12.9-inch (3rd–6th generation)",
      "iPad (7th–10th generation)",
      "iPad Mini (5th–6th generation)",
    ],
  },
  {
    brand: "Samsung",
    models: [
      "Galaxy A54 5G", "Galaxy S23", "Galaxy S23+", "Galaxy S23 Ultra",
      "Galaxy S22 5G", "Galaxy S22+ 5G", "Galaxy S22 Ultra 5G",
      "Galaxy S21 5G", "Galaxy S21+ 5G", "Galaxy S21 Ultra 5G",
      "Galaxy S20 / S20+ / S20 Ultra (5G & non-5G)",
      "Galaxy Z Flip", "Galaxy Z Flip 3 5G", "Galaxy Z Flip 4", "Galaxy Z Flip 5",
      "Galaxy Z Fold", "Galaxy Z Fold 2", "Galaxy Z Fold 3", "Galaxy Z Fold 4", "Galaxy Z Fold 5",
      "Galaxy Note 20", "Galaxy Note 20 5G", "Galaxy Note 20 Ultra", "Galaxy Note 20 Ultra 5G",
    ],
  },
  {
    brand: "Google",
    models: [
      "Pixel Fold", "Pixel 7 Pro", "Pixel 7a", "Pixel 7",
      "Pixel 6 Pro", "Pixel 6a", "Pixel 6",
      "Pixel 5a", "Pixel 5", "Pixel 4a", "Pixel 4", "Pixel 4 XL",
      "Pixel 3 & 3 XL", "Pixel 3a & 3a XL",
    ],
  },
  {
    brand: "Motorola",
    models: [
      "Motorola G53 5G", "Motorola Razr 40 Ultra",
      "Motorola Razr 2022", "Motorola Razr 2019", "Motorola Razr 5G",
      "Motorola Edge+", "Motorola Edge 40 Pro",
    ],
  },
  {
    brand: "Sony",
    models: [
      "Sony Xperia 1 V", "Sony Xperia 1 IV", "Sony Xperia 5 IV",
      "Sony Xperia 10 III Lite", "Sony Xperia 10 IV",
    ],
  },
  {
    brand: "Xiaomi",
    models: [
      "Xiaomi 13 Pro", "Xiaomi 13 Lite", "Xiaomi 13", "Xiaomi 12T Pro",
      "Xiaomi Redmi Note 11 Pro 5G",
    ],
  },
  {
    brand: "OnePlus",
    models: ["OnePlus 11"],
  },
  {
    brand: "OPPO",
    models: [
      "OPPO Find N2 Flip", "OPPO Find X3 Pro", "OPPO Find X5", "OPPO Find X5 Pro", "OPPO Reno A",
    ],
  },
  {
    brand: "Honor",
    models: ["Honor Magic5 Pro", "Honor Magic4 Pro", "Honor 90"],
  },
  {
    brand: "Huawei",
    models: ["Huawei P40", "Huawei P40 Pro", "Huawei Mate 40 Pro"],
  },
  {
    brand: "Nokia",
    models: ["Nokia XR21", "Nokia X30"],
  },
  {
    brand: "Other",
    models: [
      "Fairphone 4", "Gemini PDA 4G+Wi-Fi", "Nuu Mobile X5",
      "HAMMER Explorer PRO", "HAMMER Blade 3", "HAMMER Blade 5G",
      "AQUOS Sense4 Lite", "AQUOS R7", "AQUOS Wish", "AQUOS Zero6", "AQUOS Sense6",
      "Rakuten Big", "Rakuten Big S", "Rakuten Mini", "Rakuten Hand",
    ],
  },
];

export function EsimCompatibilityModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-link-blue hover:underline"
      >
        <Smartphone className="h-3 w-3" />
        Is my phone compatible?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-link-blue">eSIM</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">Compatible devices</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-muted-slate hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-slate">
              eSIM requires a compatible unlocked device. If your phone isn&apos;t listed, choose Physical SIM instead.
            </p>

            <div className="mt-5 grid gap-4">
              {ESIM_DEVICES.map(({ brand, models }) => (
                <div key={brand}>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-slate">{brand}</p>
                  <ul className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {models.map((m) => (
                      <li key={m} className="text-xs text-ink">{m}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
