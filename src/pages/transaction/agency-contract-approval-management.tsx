import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataTable } from "@/components/data/DataTable";
import ApprovePopup from "@/components/approval/approve-popup";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { formatDate } from "@/lib/utils";
import { ApprovalDTO } from "@/services/approval-api";
import { AppDispatch, RootState } from "@/state/store";
import { getApprovalsByCompanyIdAndScreenName } from "@/state/approvalSlice";

const AGENCY_CONTRACT_SCREEN_NAME = "Agency Contract";
const PAGE_SIZE = 10;

export default function AgencyContractApprovalManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const companyId = useResolvedCompanyId();
  const { approvalList, loading, error, paginationInfo } = useSelector(
    (state: RootState) => state.approval
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalDTO | null>(null);

  const loadApprovals = useCallback(() => {
    if (companyId != null) {
      dispatch(
        getApprovalsByCompanyIdAndScreenName({
          companyId,
          screenName: AGENCY_CONTRACT_SCREEN_NAME,
          page: currentPage,
          size: PAGE_SIZE
        })
      );
    }
  }, [companyId, currentPage, dispatch]);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  const tableData = useMemo(
    () =>
      approvalList.map((approval, index) => ({
        ...approval,
        serialNo: currentPage * PAGE_SIZE + index + 1
      })),
    [approvalList, currentPage]
  );

  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: "serialNo",
        width: 60,
        disableFilters: true
      },
      {
        Header: "Contract No",
        accessor: "entryNo",
        Cell: ({ value }: { value?: string }) => (
          <span className="font-semibold text-blue-700">{value || "—"}</span>
        )
      },
      {
        Header: "Entry Date",
        accessor: "entryDate",
        Cell: ({ value }: { value?: string }) => (value ? formatDate(value) : "—")
      },
      {
        Header: "Comments",
        accessor: "comments",
        Cell: ({ value }: { value?: string }) => (
          <span className="block max-w-sm truncate" title={value || ""}>{value || "—"}</span>
        )
      },
      {
        Header: "Approval",
        accessor: "isApproved",
        disableFilters: true,
        Cell: (props: any) => {
          const approval = props.row.original as ApprovalDTO;
          if (Number(approval.isApproved) === 1) {
            return (
              <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                Approved
              </span>
            );
          }

          return (
            <button
              type="button"
              onClick={() => setSelectedApproval(approval)}
              className="text-sm font-medium text-blue-600 underline hover:text-blue-800"
            >
              Approve
            </button>
          );
        }
      }
    ],
    []
  );

  const pageCount = Math.max(1, paginationInfo.totalPages);

  return (
    <div className="space-y-4 p-4">
      {companyId == null && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Select a company to view agency contract approvals.
        </div>
      )}
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <DataTable
        title="Agency Sales Contract Approval"
        columns={columns}
        data={tableData}
        loading={loading}
        showColumnFilters={false}
        isShowPagination={false}
        filterPlaceholder="Search Agency Contracts..."
        emptyMessage={loading ? "Loading agency contract approvals..." : "No agency contracts awaiting approval."}
      />

      {!loading && paginationInfo.totalElements > 0 && (
        <div className="flex items-center justify-between border-t px-2 py-3 text-sm text-gray-600">
          <span>
            Showing {tableData.length} of {paginationInfo.totalElements} approvals
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
              disabled={!paginationInfo.hasPrevious}
              className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {currentPage + 1} of {pageCount}</span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={!paginationInfo.hasNext}
              className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ApprovePopup
        isOpen={selectedApproval !== null}
        approval={selectedApproval}
        onClose={() => {
          setSelectedApproval(null);
          loadApprovals();
        }}
      />
    </div>
  );
}
