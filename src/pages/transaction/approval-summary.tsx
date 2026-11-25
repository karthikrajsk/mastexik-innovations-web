import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch, RootState } from "@/state/store";
import { getApprovalsSummaryByCompanyId } from "@/state/approvalSlice";
import { CheckCircle2, Clock, Eye } from "lucide-react";

export default function ApprovalSummaryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { summaryList, loading, summaryPaginationInfo } = useSelector((state: RootState) => state.approval);

  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 100;

  const companyId = localStorage.getItem("selectedCompanyId") ? parseInt(localStorage.getItem("selectedCompanyId")!) : null;

  useEffect(() => {
    if (companyId) {
      dispatch(getApprovalsSummaryByCompanyId({ companyId, page: currentPage, size: pageSize }));
    }
  }, [companyId, dispatch, currentPage]);

  const handleValidate = (salesOrderNo: string) => {
    navigate(`/settings/approval-list?salesOrderNo=${encodeURIComponent(salesOrderNo)}`);
  };

  return (
    <div className="space-y-4 p-4 md:p-6 md:space-y-6">
      <div className="mt-6">
        <h1 className="text-2xl md:text-3xl font-bold">Approval Summary</h1>
        <p className="text-sm md:text-base text-gray-600">Sales Order-wise approval statistics</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm md:text-base">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-semibold">S.No</th>
                <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-semibold">Transaction No</th>
                <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs md:text-sm font-semibold">Total Approvals</th>
                <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs md:text-sm font-semibold">Pending</th>
                <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs md:text-sm font-semibold">Approved</th>
                <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs md:text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 md:px-6 py-6 md:py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : summaryList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 md:px-6 py-6 md:py-8 text-center text-gray-500 text-sm md:text-base">
                    No approval records found
                  </td>
                </tr>
              ) : (
                summaryList.map((summary, index) => (
                  <tr key={summary.salesOrderNo} className="border-b hover:bg-gray-50">
                    <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm">{index + 1 + currentPage * pageSize}</td>
                    <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm font-medium">{summary.salesOrderNo || "—"}</td>
                    <td className="px-2 md:px-6 py-2 md:py-4 text-center text-xs md:text-sm">{summary.totalApprovals}</td>
                    <td className="px-2 md:px-6 py-2 md:py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                        <Clock size={12} className="md:w-4 md:h-4" />
                        {summary.pending}
                      </span>
                    </td>
                    <td className="px-2 md:px-6 py-2 md:py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        <CheckCircle2 size={12} className="md:w-4 md:h-4" />
                        {summary.approved}
                      </span>
                    </td>
                    <td className="px-2 md:px-6 py-2 md:py-4 text-center">
                      <button
                        onClick={() => handleValidate(summary.salesOrderNo)}
                        className="text-blue-600 hover:text-blue-800 underline flex items-center justify-center gap-1 text-xs md:text-sm"
                      >
                        <Eye size={14} className="md:w-4 md:h-4" />
                        Validate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && summaryList.length > 0 && (
          <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-t flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
            <div className="text-xs md:text-sm text-gray-600">
              Showing {summaryList.length} of {summaryPaginationInfo.totalElements} records
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={!summaryPaginationInfo.hasPrevious}
                className="px-2 md:px-4 py-1 md:py-2 border rounded-md text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <div className="flex items-center gap-1 md:gap-2">
                <span className="text-xs md:text-sm whitespace-nowrap">
                  Page {(summaryPaginationInfo?.currentPage ?? 0) + 1} of {summaryPaginationInfo?.totalPages ?? 1}
                </span>
              </div>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!summaryPaginationInfo.hasNext}
                className="px-2 md:px-4 py-1 md:py-2 border rounded-md text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
