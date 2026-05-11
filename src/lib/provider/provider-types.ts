export type ProviderOrder = {
  id: string;
  customer_id: string | null;
  plan_id?: string | null;
  provisioning_status?: string | null;
};

export type SimData = {
  iccid?: string;
  msisdn?: string;
  esim?: boolean;
  note?: string;
};

export type ProviderResult = {
  ok: boolean;
  status: string;
  message: string;
  reference?: string;
};

export interface TelecomProvider {
  createActivationRequest(order: ProviderOrder): Promise<ProviderResult>;
  assignSim(orderId: string, simData: SimData): Promise<ProviderResult>;
  sendActivationInstructions(customerId: string): Promise<ProviderResult>;
  suspendService(customerId: string): Promise<ProviderResult>;
  cancelService(customerId: string): Promise<ProviderResult>;
  getUsage(customerId: string): Promise<ProviderResult & { usage?: Record<string, unknown> }>;
}
