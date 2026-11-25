import { ApprovalWorkflowConfig } from "@/hooks/approvalWorkflowHelper";

export interface TransactionUpdateWithApprovalConfig extends ApprovalWorkflowConfig {
  onApprovalCreationSuccess?: () => void;
  onApprovalCreationError?: (error: string) => void;
  skipApprovalCreation?: boolean;
}

export interface TransactionConfig {
  entryNo: string;
  screenName: string;
  screenId?: number;
  dataId?: number;
  entryDate: string;
  editNote?: string;
  companyId?: number;
  userId?: number;
}

export const buildApprovalWorkflowConfig = (
  transactionId: number | string,
  transactionConfig: TransactionConfig,
  additionalConfig?: Partial<ApprovalWorkflowConfig>
): ApprovalWorkflowConfig => {
  return {
    transactionId,
    entryNo: transactionConfig.entryNo,
    screenName: transactionConfig.screenName,
    screenId: transactionConfig.screenId,
    dataId: transactionConfig.dataId || (typeof transactionId === 'string' ? parseInt(transactionId) : transactionId),
    entryDate: transactionConfig.entryDate,
    editNote: transactionConfig.editNote,
    companyId: transactionConfig.companyId,
    userId: transactionConfig.userId,
    ...additionalConfig
  };
};

export const validateApprovalWorkflow = (
  config: ApprovalWorkflowConfig,
  isEditing: boolean
): { isValid: boolean; error?: string } => {
  if (!isEditing) {
    return { isValid: true };
  }

  if (!config.editNote || !config.editNote.trim()) {
    return {
      isValid: false,
      error: 'Edit note is required when updating an existing transaction'
    };
  }

  if (config.editNote.length > 1000) {
    return {
      isValid: false,
      error: 'Edit note cannot exceed 1000 characters'
    };
  }

  if (!config.entryNo) {
    return {
      isValid: false,
      error: 'Entry number is required for approval workflow'
    };
  }

  if (!config.screenName) {
    return {
      isValid: false,
      error: 'Screen name is required for approval workflow'
    };
  }

  return { isValid: true };
};

export const shouldCreateApproval = (
  isEditing: boolean,
  editNote: string | undefined,
  skipApprovalCreation: boolean = false
): boolean => {
  if (skipApprovalCreation) return false;
  if (!isEditing) return false;
  if (!editNote || !editNote.trim()) return false;
  return true;
};

export const extractTransactionMetadata = (transaction: any): TransactionConfig => {
  return {
    entryNo: transaction.entryNo || transaction.id?.toString() || '',
    screenName: transaction.screenName || '',
    screenId: transaction.screenId,
    dataId: transaction.dataId || transaction.id,
    entryDate: transaction.entryDate || transaction.createdAt || new Date().toISOString(),
    editNote: transaction.editNote,
    companyId: transaction.companyId
  };
};
