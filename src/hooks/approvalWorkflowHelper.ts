import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { RootState, AppDispatch } from '@/state/store';
import { createOrUpdateApproval } from '@/state/approvalSlice';
import { ApprovalDTO } from '@/services/approval-api';

export interface ApprovalWorkflowConfig {
  transactionId: number | string;
  entryNo: string;
  screenName: string;
  screenId?: number;
  dataId?: number;
  entryDate: string;
  editNote?: string;
  additionalComments?: string;
  companyId?: number;
  userId?: number;
}

export interface TransactionUpdatePayload {
  id: number | string;
  data: any;
}

export const useApprovalWorkflow = () => {
  const dispatch = useDispatch<AppDispatch>();
  const companyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
  const userId = localStorage.getItem('userId');

  const createApprovalRecord = useCallback(
    async (config: ApprovalWorkflowConfig): Promise<boolean> => {
      try {
        if (!config.editNote || !config.editNote.trim()) {
          toast.error('Edit note is required for approval workflow');
          return false;
        }

        const approvalData: ApprovalDTO = {
          entryNo: config.entryNo,
          screenName: config.screenName,
          screenId: config.screenId,
          dataId: config.dataId,
          entryDate: config.entryDate,
          actionComments: config.editNote,
          comments: config.additionalComments
        };

        const result = await dispatch(
          createOrUpdateApproval({
            approval: approvalData,
            companyId: config.companyId ? parseInt(config.companyId.toString()) : (companyId ? parseInt(companyId) : undefined),
            userId: config.userId ? parseInt(config.userId.toString()) : (userId ? parseInt(userId) : undefined)
          })
        ).unwrap();

        if (result?.data) {
          toast.success('Approval record created successfully');
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error creating approval record:', error);
        toast.error('Failed to create approval record');
        return false;
      }
    },
    [dispatch, companyId, userId]
  );

  return { createApprovalRecord };
};