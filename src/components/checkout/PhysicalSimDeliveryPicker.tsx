"use client";

import { Truck, Mail } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { COURIER_CITIES, OTHER_CITY_VALUE, type PhysicalSimDeliveryDetails } from "@/lib/delivery";

// Shown wherever "Physical SIM" is selected — public checkout, portal
// add-line, and the admin custom-order builder. City drives everything:
// pick a covered city and next-day courier applies automatically; anywhere
// else falls back to Israel Post. No separate "choose your method" step —
// that just invites picking courier for an uncovered city by mistake.
export function PhysicalSimDeliveryPicker({
  value,
  onChange,
  idPrefix = "delivery",
}: {
  value: PhysicalSimDeliveryDetails;
  onChange: (next: PhysicalSimDeliveryDetails) => void;
  idPrefix?: string;
}) {
  // citySelection is always exactly one of COURIER_CITIES or the sentinel —
  // never free text — so this doesn't need the shared resolver.
  const method = !value.citySelection ? null : value.citySelection === OTHER_CITY_VALUE ? "israel_post" : "courier";

  return (
    <div className="grid gap-3 rounded-2xl border border-ink/10 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-ink">Delivery details</p>

      <details className="text-xs text-muted-slate">
        <summary className="cursor-pointer font-semibold text-link-blue">
          Next-day courier delivery available*
        </summary>
        <p className="mt-1.5 pl-3">
          Free next-day courier in: {COURIER_CITIES.join(", ")}. Anywhere else ships via Israel Post.
        </p>
      </details>

      <Select
        label="Delivery city"
        name={`${idPrefix}City`}
        value={value.citySelection}
        onChange={(e) => onChange({ ...value, citySelection: e.target.value })}
        required
      >
        <option value="" disabled>
          Choose your city…
        </option>
        {COURIER_CITIES.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
        <option value={OTHER_CITY_VALUE}>Other city (ships via Israel Post)</option>
      </Select>

      {value.citySelection === OTHER_CITY_VALUE && (
        <Input
          label="City name"
          name={`${idPrefix}OtherCityName`}
          value={value.otherCityName}
          onChange={(e) => onChange({ ...value, otherCityName: e.target.value })}
          required
        />
      )}

      {method && (
        <div
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
            method === "courier" ? "bg-trust-green/10 text-trust-green" : "bg-link-blue/10 text-link-blue"
          }`}
        >
          {method === "courier" ? (
            <>
              <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
              Next-day courier delivery available
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              Ships via Israel Post (standard delivery)
            </>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Address"
          name={`${idPrefix}AddressLine1`}
          value={value.addressLine1}
          onChange={(e) => onChange({ ...value, addressLine1: e.target.value })}
          placeholder="Street and number"
          required
        />
        <Input
          label="Apt / floor (optional)"
          name={`${idPrefix}AddressLine2`}
          value={value.addressLine2}
          onChange={(e) => onChange({ ...value, addressLine2: e.target.value })}
        />
      </div>

      <Input
        label="Preferred delivery date (optional)"
        name={`${idPrefix}RequestedDate`}
        type="date"
        value={value.requestedDate}
        onChange={(e) => onChange({ ...value, requestedDate: e.target.value })}
      />
      <p className="text-xs text-muted-slate">Leave blank for the soonest available delivery.</p>
    </div>
  );
}
