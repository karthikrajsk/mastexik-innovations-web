import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppDispatch, RootState } from "@/state/store";
import { getApprovalsByCompanyIdWithFilters } from "@/state/approvalSlice";
import { Eye } from "lucide-react";
import useScreenCodes from "@/hooks/useScreenCodes";
import { PurchaseIndentApprovalDetails } from "./purchase-indent-approval-details";

export default function ApprovalListPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { approvalList, loading, paginationInfo } = useSelector((state: RootState) => state.approval);
  const { getScreenValue } = useScreenCodes();

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState<'all' | 'purchaseIndent'>('all');
  const salesOrderNo = searchParams.get("salesOrderNo");
  const poNo = searchParams.get("poNo");

  const companyId = localStorage.getItem("selectedCompanyId") ? parseInt(localStorage.getItem("selectedCompanyId")!) : null;

  useEffect(() => {
    if (companyId) {
      const filters: any = {
        page: currentPage,
        size: pageSize
      };

      if (salesOrderNo) {
        filters.salesOrderNo = salesOrderNo;
      }

      dispatch(getApprovalsByCompanyIdWithFilters({ companyId, filters }));
    }
  }, [companyId, dispatch, currentPage, pageSize, salesOrderNo]);

  const handleViewApproval = (id?: number) => {
    if (!id) {
      alert("Invalid approval record");
      return;
    }
    navigate(`/settings/approval-notification/${id}`);
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
     return new Date(date).toLocaleDateString("en-GB");
  };

  return (
    <div className="space-y-4 p-4 md:p-6 md:space-y-6">
      <div className="flex gap-4 border-b">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`pb-2 px-4 text-sm font-semibold transition-colors ${
            activeTab === 'all'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Approvals
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('purchaseIndent')}
          className={`pb-2 px-4 text-sm font-semibold transition-colors ${
            activeTab === 'purchaseIndent'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Purchase Indent
        </button>
      </div>

      {activeTab === 'purchaseIndent' ? (
        <PurchaseIndentApprovalDetails />
      ) : (
        <>
          <div className="mt-2">
            {salesOrderNo && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                <span className="text-sm text-blue-800">
                  Filtered by Transaction No: <span className="font-semibold">{salesOrderNo}</span>
                </span>
                <button
                  onClick={() => navigate("/settings/approval-list")}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm md:text-base">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-semibold">S.No</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-semibold">Entry Date</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-semibold hidden sm:table-cell">Sales Order No</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-semibold">Screen Name</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-semibold hidden md:table-cell">Entry No</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-semibold">Status</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs md:text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 md:px-6 py-6 md:py-8 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : approvalList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 md:px-6 py-6 md:py-8 text-center text-gray-500 text-sm md:text-base">
                        No approval records found
                      </td>
                    </tr>
                  ) : (
                    approvalList.map((approval, index) => (
                      <tr key={approval.id} className="border-b hover:bg-gray-50">
                        <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm">{index + 1 + currentPage * pageSize}</td>
                        <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm">{formatDate(approval.entryDate)}</td>
                        <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm hidden sm:table-cell">{approval.salesOrderNo || "-"}</td>
                        <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm">{getScreenValue(approval.screenName)}</td>
                        <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm font-medium hidden md:table-cell">{approval.entryNo}</td>
                        <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm">
                          {approval.isApproved === 1 ? (
                            <span className="px-2 md:px-3 py-0.5 md:py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              Approved
                            </span>
                          ) : (
                            <span className="px-2 md:px-3 py-0.5 md:py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 text-center">
                          <button
                            onClick={() => handleViewApproval(approval.id)}
                            className="text-blue-600 hover:text-blue-800 underline flex items-center justify-center gap-1 text-xs md:text-sm"
                          >
                            <Eye size={14} className="md:w-4 md:h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && approvalList.length > 0 && (
              <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-t flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
                <div className="text-xs md:text-sm text-gray-600">
                  Showing {approvalList.length} of {paginationInfo.totalElements} records
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={!paginationInfo.hasPrevious}
                    className="px-2 md:px-4 py-1 md:py-2 border rounded-md text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1 md:gap-2">
                    <span className="text-xs md:text-sm whitespace-nowrap">
                      Page {(paginationInfo?.currentPage ?? 0) + 1} of {paginationInfo?.totalPages ?? 1}
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!paginationInfo.hasNext}
                    className="px-2 md:px-4 py-1 md:py-2 border rounded-md text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
