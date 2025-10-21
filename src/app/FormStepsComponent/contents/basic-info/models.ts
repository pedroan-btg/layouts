export interface Rating {
  Agency: string;
  Value: string;
}

export interface BallastInfo {
  LCI: boolean;
  LCA: boolean;
  Rural: boolean;
  Compromissada: boolean;
}

export interface DealStatus {
  Id: number;
  Description: string;
}

export interface RatingPdd {
  PE: number;
  PD: number;
  LGD: number;
  Stage: number;
  KEAD: number;
  IncurredLoss: number;
  PortfolioClassification: string;
  RatingCounterparty: string;
  Type: string;
}

export interface CollateralItem {
  Account: string;
  Type: string;
  FieldType: string;
  FieldValue: string;
  Amount: number;
  Quantity: string; // informado como string no mock
  Categorized: boolean;
  Asset: string;
  AssetCode: string;
  CpfCnpj: string;
  LendingValue: number;
  MarketValue: number;
  IsEditable: boolean;
  AdditionalData: null; // mantido conforme o mock
  CertificateId: null;
  PensionFundDetails: null;
  MaturityDate: string | null;
  ReferenceDate: string | null;
  Currency: string;
  ComplementaryInfos: null;
}

export type FeeItem = Record<string, never>;
export type GuaranteeItem = Record<string, never>;

export interface DealRas {
  Amount: number;
  ApprovedSpread: number;
  CurrencyCode: string;
  CounterpartyCge: number;
  PartyCge: number;
  Term: number;
  TermUnit: string;
  ProductCanonical: string;
  UseOfProceedsCanonical: string;
  InterestIndexCanonical: string;
  InterestFrequencyCode: string;
  InterestIndexPerc: number;
  InterestGracePeriod: number;
  InterestRatePerc: number;
  InterestRatePercEngine: number;
  AmortizationFrequencyCode: string;
  AmortizationGracePeriod: number;
  DisbursementDate: string;
  MaturityDate: string;
  FinanceIof: boolean;
  Rating: Rating;
  BallastInfo: BallastInfo;
  Penalty: number;
  DefaultCharges: number;
  LstFee: FeeItem[];
  LstGuarantee: GuaranteeItem[];
  LstCollateral: CollateralItem[];
  FundingFee: number;
  FundedLV: number;
  LtvMarginCall: number;
  LtvCollateral: number;
  Book: string | null;
  Strategy: string | null;
  Account: string;
  DealStatus: DealStatus;
  PaymentDay: number | null;
  RatingPdd: RatingPdd;
  BaseContract: string | null;
  NewContract: string;
  NewCollateral: string;
}

export interface DealRasResponse extends DealRas {
  /**
   * Campo derivado para consumo no UI.
   * Preenchido a partir de DealStatus.Description.
   */
  status: string;
}

export interface Contrato {
  id: string;
  chave: string;
  operacao: string;
  vinculoTrade: string;
  acao: string;
}

export type ContratoApi = Contrato;

export interface ContratosApiResponse {
  data: ContratoApi[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TipoBaixa {
  label: string;
  value: string;
}
