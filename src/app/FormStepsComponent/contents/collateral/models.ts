export interface Collateral {
  id: string;
  type: string;
  tickerOrName: string;
  guarantor: string;
  account: string;
  linked: boolean;
  unitPrice: number;
  allocatedQuantity: number;
  value: number;
  lendingValue: number;
  issuer: string;
  isinCode: string;
  assetCode: string;
  status: string;
}

export type CollateralPayload = Omit<Collateral, 'id' | 'status'> & {
  status?: string;
};
