export interface TransactionEditNotePayload {
  editNote?: string | null;
}

export interface ApprovalWorkflowTransactionConfig {
  entryNo: string;
  screenName: string;
  screenCode?: string;
  screenId?: number;
  dataId?: number;
  entryDate: string;
  editNote?: string;
  additionalComments?: string;
}

export interface ApprovalCreateRequest {
  entryNo: string;
  screenName: string;
  screenId?: number;
  dataId?: number;
  entryDate: string;
  actionComments?: string;
  comments?: string;
  companyId?: number;
}

export enum TransactionScreenType {
  SALES_ORDER = 'Sales Order Management',
  PURCHASE_ORDER = 'Purchase Order Management',
  PURCHASE_INWARD = 'Purchase Inward',
  WEAVING_CONTRACT = 'Weaving Contract',
  WEAVING_YARN_ISSUE = 'Weaving Yarn Issue',
  JOBWORK_FABRIC = 'Jobwork Fabric',
  FABRIC_INSPECTION = 'Fabric Inspection',
  PROCESSING_CONTRACT = 'Processing Contract',
  PROCESSING_FABRIC = 'Processing Fabric',
  PROCESSING_YARN = 'Processing Yarn',
  PROCESSING_FABRIC_ISSUE = 'Processing Fabric Issue',
  PROCESSING_YARN_ISSUE = 'Processing Yarn Issue',
  PROCESSING_FABRIC_RECEIVE = 'Processing Fabric Receive',
  PROCESSING_YARN_RECEIVE = 'Processing Yarn Receive'
}

export interface ApprovalWorkflowIntegrationConfig {
  isEditMode: boolean;
  transactionId?: number | string;
  entryNo?: string;
  screenName: string;
  screenId?: number;
  dataId?: number;
  entryDate?: string;
  editNote?: string;
  onApprovalSuccess?: () => void;
  onApprovalError?: (error: string) => void;
  skipApprovalCreation?: boolean;
}
