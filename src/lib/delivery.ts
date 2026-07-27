// Physical SIM delivery — shared between public checkout, portal add-line,
// and the admin custom-order builder (all three trigger this when physical
// SIM is chosen). Method is always derived from city, never trusted as a
// separate client-sent value — see resolveDeliveryMethod.

export const COURIER_CITIES = [
  "Jerusalem",
  "Beit Shemesh",
  "Modiin",
  "Beitar Illit",
  "Telstone",
  "Mivaseret",
  "Beit Meir",
] as const;

// Sentinel value for the "somewhere else" option in the city picker.
export const OTHER_CITY_VALUE = "other";

export type DeliveryMethod = "courier" | "israel_post";

export function isCourierCity(city: string): boolean {
  return (COURIER_CITIES as readonly string[]).includes(city);
}

export function resolveDeliveryMethod(city: string): DeliveryMethod {
  return isCourierCity(city) ? "courier" : "israel_post";
}

export type PhysicalSimDeliveryDetails = {
  // One of COURIER_CITIES, or OTHER_CITY_VALUE when the customer's city
  // isn't in the courier list.
  citySelection: string;
  // Only meaningful when citySelection === OTHER_CITY_VALUE.
  otherCityName: string;
  addressLine1: string;
  addressLine2: string;
  // yyyy-mm-dd, or "" for "as soon as possible".
  requestedDate: string;
};

export const emptyDeliveryDetails: PhysicalSimDeliveryDetails = {
  citySelection: "",
  otherCityName: "",
  addressLine1: "",
  addressLine2: "",
  requestedDate: "",
};

// The actual city name to store/display, resolving the "other" sentinel to
// whatever free-text name the customer typed.
export function resolveDeliveryCity(details: PhysicalSimDeliveryDetails): string {
  return details.citySelection === OTHER_CITY_VALUE ? details.otherCityName.trim() : details.citySelection;
}

export function isDeliveryDetailsComplete(details: PhysicalSimDeliveryDetails): boolean {
  const city = resolveDeliveryCity(details);
  return Boolean(city && details.addressLine1.trim());
}
