// Mock data removed - all Agency module screens now connected to live Spring Boot REST APIs:
// 1. /api/agency-contract
// 2. /api/agency-dispatch
// 3. /api/agency-payment
// 4. /api/agency-commission-statement
// 5. Buyer Outstanding dynamically computed from live dispatches and payments

import {
  AgencyContract,
  AgencyDispatch,
  AgencyPayment,
  BuyerOutstanding,
  CommissionStatement
} from '../types/agency';

export const INITIAL_AGENCY_CONTRACTS: AgencyContract[] = [];
export const INITIAL_DISPATCHES: AgencyDispatch[] = [];
export const INITIAL_PAYMENTS: AgencyPayment[] = [];
export const INITIAL_BUYER_OUTSTANDING: BuyerOutstanding[] = [];
export const INITIAL_COMMISSION_STATEMENTS: CommissionStatement[] = [];

export const SELLERS_LIST = [
  "L.S Mills",
  "Kalaimagal Textiles"
];

export const BUYERS_LIST = [
  "Indo Count Industries",
  "Creative Textile Mills",
  "Samy Traders",
  "G.S. Exports",
  "HYS Developers LLP"
];

export const calculateAgeing = (invoiceDateStr: string) => {
  if (!invoiceDateStr) return { noOfDays: 0, ageingBucket: '0-30 Days' as const };
  const invDate = new Date(invoiceDateStr);
  const today = new Date();
  const diffTime = today.getTime() - invDate.getTime();
  const noOfDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  let ageingBucket: '0-30 Days' | '31-60 Days' | '61-90 Days' | '>90 Days' = '0-30 Days';
  if (noOfDays > 90) ageingBucket = '>90 Days';
  else if (noOfDays > 60) ageingBucket = '61-90 Days';
  else if (noOfDays > 30) ageingBucket = '31-60 Days';
  return { noOfDays, ageingBucket };
};

export const getContractsStore = (): AgencyContract[] => [];
export const addContractToStore = (newContract: any): any => newContract;
export const updateContractInStore = (_id: any, _updated: any): any => null;
export const deleteContractFromStore = (_id: any): boolean => true;

export const getDispatchesStore = (): AgencyDispatch[] => [];
export const addDispatchToStore = (newDispatch: any): any => newDispatch;
export const updateDispatchInStore = (_id: any, _updated: any): any => null;
export const deleteDispatchFromStore = (_id: any): boolean => true;

export const getPaymentsStore = (): AgencyPayment[] => [];
export const addPaymentToStore = (newPayment: any): any => newPayment;
export const updatePaymentInStore = (_id: any, _updated: any): any => null;
export const deletePaymentFromStore = (_id: any): boolean => true;

export const getOutstandingStore = (): BuyerOutstanding[] => [];
export const updateOutstandingInStore = (_id: any, _updated: any): any => null;

export const getCommissionStore = (): CommissionStatement[] => [];
export const addCommissionStatementToStore = (newStatement: any): any => newStatement;
export const updateCommissionStatementInStore = (_id: any, _updated: any): any => null;

export const resetAgencyMockStores = () => {};
