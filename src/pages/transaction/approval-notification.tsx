import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { AppDispatch, RootState } from "@/state/store";
import { getApprovalById, getApprovalByEntryNoAndScreen } from "@/state/approvalSlice";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ApprovePopup from "@/components/approval/approve-popup";
import useScreenCodes from "@/hooks/useScreenCodes";


export default function ApprovalNotificationPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentApproval, loading, error } = useSelector((state: RootState) => state.approval);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const { getScreenValue } = useScreenCodes();

  useEffect(() => {
    if (id) {
      dispatch(getApprovalById(parseInt(id)));
    }
  }, [dispatch, id]);

  if (!id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-md">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold">Approval Details</h1>
        </div>
        <div className="bg-red-100 text-red-800 p-4 rounded-md">
          Invalid approval ID. Please try again.
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const formatDateTime = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !currentApproval) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-md">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold">Approval Details</h1>
        </div>
        <div className="bg-red-100 text-red-800 p-4 rounded-md">
          {error || "Approval record not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-4 pt-4 md:pt-6">
      <div className="flex items-center gap-2 -ml-2">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-md flex-shrink-0">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg md:text-2xl font-bold">Approval Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="md:col-span-1 lg:col-span-2 space-y-3 md:space-y-4">
          <div className="bg-white rounded-lg shadow-md p-3 md:p-5">
            <h2 className="text-base md:text-lg font-semibold mb-3">Entry Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Entry No
                </label>
                <div className="bg-gray-50 px-2 py-1.5 rounded text-xs md:text-sm text-gray-900 font-medium">
                  {currentApproval.entryNo}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Screen Name
                </label>
                <div className="bg-gray-50 px-2 py-1.5 rounded text-xs md:text-sm text-gray-900">
                  {getScreenValue(currentApproval.screenName)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Entry Date
                </label>
                <div className="bg-gray-50 px-2 py-1.5 rounded text-xs md:text-sm text-gray-900">
                  {formatDate(currentApproval.entryDate)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sales Order No
                </label>
                <div className="bg-gray-50 px-2 py-1.5 rounded text-xs md:text-sm text-gray-900">
                  {currentApproval.salesOrderNo || "-"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 md:p-5">
            <h2 className="text-base md:text-lg font-semibold mb-3">Comments</h2>
            <div className="bg-gray-50 px-2 py-2 rounded text-xs md:text-sm text-gray-900 min-h-20">
              {currentApproval.comments || "No comments"}
            </div>
          </div>

          {currentApproval.actionComments && (
            <div className="bg-white rounded-lg shadow-md p-3 md:p-5 border-l-4 border-blue-500">
              <h2 className="text-base md:text-lg font-semibold mb-3 text-blue-700">Action / Edit Note</h2>
              <div className="bg-gray-50 px-2 py-2 rounded text-xs md:text-sm text-gray-900 min-h-20">
                {currentApproval.actionComments}
              </div>
            </div>
          )}

          {currentApproval.isApproved === 1 && (
            <div className="bg-white rounded-lg shadow-md p-3 md:p-5 border-l-4 border-green-500">
              <h2 className="text-base md:text-lg font-semibold mb-3 text-green-700">Approval Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Approved Date
                  </label>
                  <div className="bg-gray-50 px-2 py-1.5 rounded text-xs md:text-sm text-gray-900">
                    {currentApproval.approvedDate ? formatDate(currentApproval.approvedDate) : '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Approved By (User ID)
                  </label>
                  <div className="bg-gray-50 px-2 py-1.5 rounded text-xs md:text-sm text-gray-900">
                    {currentApproval.approvedBy || "-"}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Approval Comments
                </label>
                <div className="bg-gray-50 px-2 py-2 rounded text-xs md:text-sm text-gray-900 min-h-16">
                  {currentApproval.approvedComments || "No approval comments"}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-1 space-y-3 md:space-y-4">
          <div className="bg-white rounded-lg shadow-md p-3 md:p-5">
            <h3 className="text-sm md:text-base font-semibold mb-3">Status</h3>
            <div className="text-center">
              {currentApproval.isApproved === 1 ? (
                <div>
                  <div className="px-3 py-1.5 md:py-2 bg-green-100 text-green-800 rounded-lg mb-2 font-semibold text-xs md:text-sm">
                    Approved
                  </div>
                  <p className="text-xs text-gray-600">
                    Approved on {currentApproval.approvedDate ? formatDate(currentApproval.approvedDate) : '-'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="px-3 py-1.5 md:py-2 bg-yellow-100 text-yellow-800 rounded-lg mb-2 font-semibold text-xs md:text-sm">
                    Pending Approval
                  </div>
                  <p className="text-xs text-gray-600">
                    Awaiting approval
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 md:p-5">
            <h3 className="text-sm md:text-base font-semibold mb-3">Actions</h3>
            {currentApproval.isApproved === 0 ? (
              <Button
                onClick={() => setShowApproveModal(true)}
                className="w-full text-xs md:text-sm py-2"
              >
                Approve
              </Button>
            ) : (
              <div className="text-center text-gray-500 text-xs py-3">
                This entry has already been approved
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-2 md:p-3">
            <h4 className="font-semibold text-xs mb-2">Metadata</h4>
            <div className="text-xs text-gray-600 space-y-0.5">
              <p>
                <strong>Created:</strong> {currentApproval.createdAt ? formatDateTime(currentApproval.createdAt) : '-'}
              </p>
              <p>
                <strong>Updated:</strong> {currentApproval.updatedAt ? formatDateTime(currentApproval.updatedAt) : '-'}
              </p>
              <p>
                <strong>Company ID:</strong> {currentApproval.companyId}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ApprovePopup
        isOpen={showApproveModal}
        approval={currentApproval}
        onClose={() => setShowApproveModal(false)}
      />
    </div>
  );
}
