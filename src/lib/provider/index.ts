import { manualProvider } from "./manual-provider";

export function getTelecomProvider() {
  return manualProvider;
}

export type { ProviderOrder, ProviderResult, SimData, TelecomProvider } from "./provider-types";
