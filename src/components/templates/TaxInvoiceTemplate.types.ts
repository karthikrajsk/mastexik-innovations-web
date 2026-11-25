/**
 * Type definitions for Tax Invoice Template
 */

export interface CompanyInfo {
  name: string;
  address: string;
  postalCode?: string;
  phone?: string;
  division?: string;
  cin?: string;
  gstin?: string;
  pan?: string;
  logoUrl?: string;
  dispatchAddress?: string;
  dispatchGstin?: string;
  dispatchCity?: string;
  dispatchState?: string;
  dispatchStateCode?: string;
  state?: string;
  stateCode?: string;
}

export interface InvoiceInfo {
  irn?: string;
  ackNo?: string;
  ackDate?: string;
  ewayBillNo?: string;
  ewayBillDate?: string;
  invoiceNo: string;
  invoiceDate: string;
  soNo?: string;
  soDate?: string;
  poNo?: string;
  poDate?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  deliveryNote?: string;
  agentName?: string;
  lrDate?: string;
  termsOfDelivery?: string;
  vehicleNo?: string;
  destination?: string;
  transport?: string;
  lrNo?: string;
  comments?: string;
  deliveryNoteDate?: string;
}

export interface PartyInfo {
  name: string;
  address: string;
  gstNo?: string;
  state?: string;
  stateCode?: string;
}

export interface InvoiceItem {
  srNo: number;
  description: string;
  hsn: string;
  noOfBags?: number;
  quantity: number;
  uom: string;
  rate: number;
  amount: number;
}

export interface AdditionalCharge {
  description: string;
  amount: number;
}

export interface LessCharge {
  description: string;
  amount: number;
}

export interface TaxSummary {
  add?: number;
  less?: number;
  total: number;
  igst?: number;
  cgst?: number;
  sgst?: number;
  cgstPercent?: number;
  sgstPercent?: number;
  tcsAmount?: number;
  roundOff?: number;
  cessAmount?: number;
  grandTotal: number;
}

export interface BankDetails {
  bankName: string;
  accountNo: string;
  branch?: string;
  ifscCode?: string;
  branchAndIFSC?: string;
}

export interface TaxInvoiceData {
  company: CompanyInfo;
  invoice: InvoiceInfo;
  buyer: PartyInfo;
  consignee: PartyInfo;
  items: InvoiceItem[];
  additionalCharges?: AdditionalCharge[];
  lessCharges?: LessCharge[];
  taxSummary: TaxSummary;
  amountInWords: string;
  termsAndConditions?: string;
  declaration?: string;
  bankDetails: BankDetails;
}

