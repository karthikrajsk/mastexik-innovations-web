export type ContractStatus = 'ACTIVE' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED';
export type LcStatus = 'OPENED' | 'PENDING' | 'NA';
export type DispatchStatus = 'Delivered' | 'In-Transit' | 'Cancelled';
export type PaymentStatus = 'Fully Settled' | 'Partially Settled' | 'Pending Settlement';
export type CommissionStatus = 'Draft' | 'Billed' | 'Paid' | 'Cancelled';

// ==========================================
// 1. Agency Contract (Screen 1)
// ==========================================
export interface AgencyContract {
  id: string | number;
  sNo: number;
  contractNo: string;
  contractDate: string;
  seller: string; // Mill name (e.g. L.S. Mills, Kalaimagal Textiles)
  buyerName: string; // Buyer name (e.g. Indo Count Industries, Samy Traders)
  construction: string; // Fabric / Yarn construction description
  orderedQty: number; // In meters or kgs
  pieceLength?: number | null;
  packing?: string | null;
  suppliedQty: number; // Delivered so far
  balanceQty: number; // Remaining to deliver
  despatchSchedule: string; // e.g. "Sep-5k, oct-60k, Nov-60k, 15th Dec-25k"
  paymentTerms: string; // e.g. "LC-90 days", "30 days", "45 days"
  ratePerMtr: string; // e.g. "518.00+GST"
  numericRate: number; // 518.00
  cdRate?: string; // Cash Discount Rate e.g. "502.46" or "Ex-mill"
  poNo?: string; // Buyer PO No e.g. "4200062140 / 04.07.2026"
  poDate?: string;
  icilConfirm?: string; // e.g. "Confirmed", "Pending"
  lcOpen: LcStatus; // 'OPENED' | 'PENDING' | 'NA'
  commissionRate: number; // 0.01 (1%) or 0.005 (0.5%)
  status: ContractStatus;
  isApproved?: number | boolean;
  deliveryLocation?: string;
  remarks?: string;
}

export interface NewContractFormData {
  contractNo: string;
  contractDate: string;
  seller: string;
  buyerName: string;
  construction: string;
  orderedQty: number;
  despatchSchedule: string;
  paymentTerms: string;
  ratePerMtr: string;
  numericRate: number;
  cdRate: string;
  poNo: string;
  icilConfirm: string;
  lcOpen: LcStatus;
  commissionRate: number;
  deliveryLocation: string;
  remarks: string;
}

// ==========================================
// 2. Mill Dispatch Tracking (Screen 2)
// ==========================================
export interface AgencyDispatch {
  id: string | number;
  sNo: number;
  millInvoiceNo: string; // e.g. "2627050079", "286", "520"
  invoiceDate: string;
  contractNo: string; // Links to AgencyContract
  seller: string; // Mill
  buyerName: string; // Buyer
  construction: string;
  dispatchedMtrs: number;
  taxableValue: number;
  gstRate: number; // 0.05 (5%)
  gstValue: number;
  totalValue: number; // taxableValue + gstValue
  lrNo?: string; // Transporter Lorry Receipt No
  transporterName?: string;
  vehicleNo?: string;
  commissionEligibleValue: number;
  status: DispatchStatus;
  remarks?: string;
}

export interface NewDispatchFormData {
  millInvoiceNo: string;
  invoiceDate: string;
  contractNo: string;
  seller: string;
  buyerName: string;
  construction: string;
  dispatchedMtrs: number;
  taxableValue: number;
  gstRate: number;
  lrNo?: string;
  transporterName?: string;
  vehicleNo?: string;
  remarks?: string;
}

// ==========================================
// 3. Payment Realization & TDS 194Q (Screen 3)
// ==========================================
export interface AgencyPayment {
  id: string | number;
  sNo: number;
  millInvoiceNo: string;
  invoiceDate: string;
  seller: string;
  buyerName: string;
  construction: string;
  totalInvoiceValue: number;
  tdsRate: number; // 0.001 (0.1% u/s 194Q)
  tdsDeducted: number; // Taxable * 0.1%
  receivedAmount: number;
  balanceAmount: number; // totalInvoiceValue - tdsDeducted - receivedAmount - debitNotes
  debitNotes: number; // Quality / shortage / debit notes
  paymentDate: string; // DT e.g. "2026-04-30"
  paymentMode: 'RTGS / NEFT' | 'Cheque' | 'LC Realization' | 'Draft';
  referenceNo: string; // UTR / Cheque No
  status: PaymentStatus;
  remarks?: string;
}

export interface NewPaymentFormData {
  millInvoiceNo: string;
  invoiceDate: string;
  seller: string;
  buyerName: string;
  totalInvoiceValue: number;
  tdsDeducted: number;
  receivedAmount: number;
  debitNotes: number;
  paymentDate: string;
  paymentMode: 'RTGS / NEFT' | 'Cheque' | 'LC Realization' | 'Draft';
  referenceNo: string;
  remarks?: string;
}

// ==========================================
// 4. Buyer Outstanding & Ageing (Screen 4)
// ==========================================
export interface BuyerOutstanding {
  id: string | number;
  sNo: number;
  buyerName: string;
  seller: string;
  invoiceNo: string;
  invoiceDate: string;
  construction: string;
  quantityMtrs: number;
  taxableValue: number;
  gstValue: number;
  totalValue: number;
  lessTds: number;
  noOfDays: number; // Days overdue
  ageingBucket: '0-30 Days' | '31-60 Days' | '61-90 Days' | '>90 Days';
  outstandingAmount: number;
  lastReminderDate?: string;
  followUpRemarks?: string;
  promiseToPayDate?: string;
}

// ==========================================
// 5. Commission Statement & Billing (Screen 5)
// ==========================================
export interface CommissionInvoiceItem {
  id: string | number;
  millInvoiceNo: string;
  invoiceDate: string;
  buyerName: string;
  construction: string;
  mtrs: number;
  taxableValue: number;
  commissionRate: number; // e.g. 0.01 (1%)
  commissionAmount: number;
}

export interface CommissionStatement {
  id: string | number;
  sNo: number;
  statementNo: string; // e.g. "HFPL/COMM/2026-27/012"
  statementDate: string;
  seller: string; // Mill billed
  sellerAddress?: string;
  sellerGst?: string;
  period: string; // e.g. "April - May 2026" or "October 2026"
  sacCode: string; // 996111
  totalTurnoverEligible: number;
  commissionRate: number; // 0.01
  grossCommission: number;
  gstRate: number; // 0.18 (18%)
  cgstAmount: number; // 9%
  sgstAmount: number; // 9%
  igstAmount: number; // 18% (if inter-state)
  totalBillAmount: number;
  tds194HRate: number; // 0.05 (5%)
  tds194HAmount: number;
  netReceivable: number;
  status: CommissionStatus;
  paymentReceivedDate?: string;
  items: CommissionInvoiceItem[];
  remarks?: string;
}
