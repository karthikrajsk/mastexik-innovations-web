import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/state/store";
import { approveEntry, getApprovalById } from "@/state/approvalSlice";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApprovalDTO, ApprovalRequestDTO } from "@/services/approval-api";

interface ApprovePopupProps {
  isOpen: boolean;
  approval: ApprovalDTO | null;
  onClose: () => void;
}

export default function ApprovePopup({ isOpen, approval, onClose }: ApprovePopupProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [approvalComments, setApprovalComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleApprove = async () => {
    if (!approvalComments.trim()) {
      setError("Comments are required");
      return;
    }

    if (!approval?.id) {
      setError("Invalid approval record");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const approvalRequest: ApprovalRequestDTO = {
        approvedComments: approvalComments,
        approvedDate: getCurrentDate()
      };

      const userId = localStorage.getItem("userId") ? parseInt(localStorage.getItem("userId")!) : undefined;
      
      const result = await dispatch(approveEntry({ 
        id: approval.id, 
        approvalRequest, 
        userId 
      }));

      if (approveEntry.fulfilled.match(result)) {
        if (approval.id) {
          dispatch(getApprovalById(approval.id));
        }
        setApprovalComments("");
        onClose();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to approve entry";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !approval) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Approve Entry</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approved Date
            </label>
            <input
              type="date"
              value={getCurrentDate()}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">Auto-populated with today's date</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments <span className="text-red-500">*</span>
            </label>
            <textarea
              value={approvalComments}
              onChange={(e) => {
                setApprovalComments(e.target.value);
                setError(null);
              }}
              placeholder="Enter approval comments (mandatory)"
              rows={5}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-md text-sm text-blue-700">
            <p className="font-semibold mb-1">Entry Details:</p>
            <p>Entry No: {approval.entryNo}</p>
            <p>Screen: {approval.screenName}</p>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading || !approvalComments.trim()}
            className="flex-1"
          >
            {loading ? "Approving..." : "Approve"}
          </Button>
        </div>
      </div>
    </div>
  );
}
