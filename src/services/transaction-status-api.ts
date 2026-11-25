import apiService from "@/services/ApiService";
import { TransactionStatusPayload } from "@/types/transaction-status";

export const TransactionStatusAPI = {
  postTransactionStatus(payload: TransactionStatusPayload) {
    return apiService.post("/transaction-status", payload);
  }
};
