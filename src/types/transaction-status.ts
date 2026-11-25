export interface TransactionStatusPayload {
  id: number;
  transactionTypeId: number;
  transactionTypeName: string;
  buyerId?: number;
  vendorId: number;
  date: string;
  description: string;
  status: string;
  isActive: boolean;
}
