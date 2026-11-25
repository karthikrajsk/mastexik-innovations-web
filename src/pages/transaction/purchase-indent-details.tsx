import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { DataTable } from "@/components/data/DataTable";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { formatDate } from "@/lib/utils";
import { AppDispatch, RootState } from "@/state/store";
import {
  deletePurchaseIndent,
  getPurchaseIndents,
  isPurchaseIndentEditable,
  PurchaseIndent,
} from "@/state/purchaseIndentSlice";

const statusClass = (status: string) => {
  switch (status) {
    case "Draft":
      return "bg-gray-100 text-gray-700";
    case "Pending approval":
    case "Pending":
      return "bg-amber-100 text-amber-800";
    case "Approved":
      return "bg-green-100 text-green-800";
    case "Rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const TABS = [
  { label: "All", value: "All" },
  { label: "Draft", value: "Draft" },
  { label: "Pending", value: "Pending approval" },
  { label: "Approved", value: "Approved" },
];

export function PurchaseIndentDetails() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const companyId = useResolvedCompanyId();
  const { purchaseIndentList, pagination, loading, error } = useSelector(
    (state: RootState) => state.purchaseIndent
  );
  const { currentPage, itemsPerPage, handlePageChange, resetPage, getOffset } =
    usePagination({ itemsPerPage: 10 });
  const [statusFilter, setStatusFilter] = useState("All");
  const [indentToDelete, setIndentToDelete] = useState<PurchaseIndent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadIndents = () => {
    if (!companyId) {
      toast.error("Select a company before viewing purchase indents.");
      return;
    }
    dispatch(getPurchaseIndents({
      offset: getOffset(),
      limit: itemsPerPage,
      companyId,
      ...(statusFilter !== "All" ? { status: statusFilter } : {}),
    }));
  };

  useEffect(() => {
    if (companyId) {
      dispatch(getPurchaseIndents({
        offset: getOffset(),
        limit: itemsPerPage,
        companyId,
        ...(statusFilter !== "All" ? { status: statusFilter } : {}),
      }));
    }
  }, [dispatch, companyId, currentPage, getOffset, itemsPerPage, statusFilter]);

  const filteredIndents = useMemo(() => purchaseIndentList, [purchaseIndentList]);

  const columns = useMemo(() => [
    {
      Header: "Indent No",
      accessor: "indentNo",
      Cell: ({ value }: { value: string }) => <span className="font-semibold text-blue-700">{value || "—"}</span>,
    },
    {
      Header: "Indent Date",
      accessor: "indentDate",
      Cell: ({ value }: { value: string }) => formatDate(value),
    },
    { Header: "Department", accessor: "department" },
    { Header: "Requested By", accessor: "requestedBy" },
    {
      Header: "Required Date",
      accessor: "requiredDate",
      Cell: ({ value }: { value: string }) => formatDate(value),
    },
    {
      Header: "Items",
      accessor: (row: PurchaseIndent) => row.items?.length ?? 0,
      id: "itemCount",
      disableSorting: true,
    },
    {
      Header: "Priority",
      accessor: "priority",
      Cell: ({ value }: { value: string }) => <span>{value || "Normal"}</span>,
    },
    {
      Header: "Status",
      accessor: "status",
      Filter: undefined,
      Cell: ({ value }: { value: string }) => (
        <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${statusClass(value)}`}>{value}</span>
      ),
    },
  ], []);

  const openIndent = (indent: PurchaseIndent, mode: "edit" | "view") => {
    const query = new URLSearchParams({ id: String(indent.id) });
    if (mode === "view") query.set("mode", "view");
    navigate(`/transaction/purchase-indent-entry?${query.toString()}`);
  };

  const confirmDelete = async () => {
    if (!indentToDelete || !companyId) return;
    setIsDeleting(true);
    try {
      await dispatch(deletePurchaseIndent({ id: indentToDelete.id, companyId })).unwrap();
      toast.success("Purchase indent deleted.");
      setIndentToDelete(null);
      resetPage();
      try {
        await dispatch(getPurchaseIndents({
          offset: 0,
          limit: itemsPerPage,
          companyId,
          ...(statusFilter !== "All" ? { status: statusFilter } : {}),
        })).unwrap();
      } catch (refreshError: unknown) {
        toast.error(
          `Purchase indent was deleted, but the list could not be refreshed: ${
            typeof refreshError === "string"
              ? refreshError
              : refreshError instanceof Error
              ? refreshError.message
              : "Unable to reload purchase indents."
          }`
        );
      }
    } catch (deleteError: unknown) {
      toast.error(
        typeof deleteError === "string"
          ? deleteError
          : deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete the purchase indent."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 border-b">
        {TABS.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => {
                setStatusFilter(tab.value);
                resetPage();
              }}
              className={`px-4 pb-2 transition-colors ${
                isActive
                  ? "border-b-2 border-blue-500 font-semibold text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {!companyId && (
        <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Select a company to load purchase indents.
        </div>
      )}
      {error && (
        <div role="alert" className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={loadIndents} disabled={loading}>
            <RefreshCw size={14} className="mr-2" /> Retry
          </Button>
        </div>
      )}

      <DataTable
        title=""
        columns={columns}
        data={filteredIndents}
        loading={loading}
        showActions
        showColumnFilters
        showExport={false}
        showPdfExport={false}
        disableFullDataFetch
        isShowPagination={false}
        filterPlaceholder="Search indent no, department, requester..."
        emptyMessage={loading ? "Loading purchase indents..." : "No purchase indents found."}
        onAdd={() => navigate("/transaction/purchase-indent-entry")}
        renderActions={(row: PurchaseIndent) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="View purchase indent"
              aria-label={`View ${row.indentNo}`}
              onClick={() => openIndent(row, "view")}
              className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-blue-700"
            >
              <Eye size={16} />
            </button>
            {isPurchaseIndentEditable(row) && (
              <button
                type="button"
                title="Edit purchase indent"
                aria-label={`Edit ${row.indentNo}`}
                onClick={() => openIndent(row, "edit")}
                className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-blue-700"
              >
                <Pencil size={16} />
              </button>
            )}
            {isPurchaseIndentEditable(row) && (
              <button
                type="button"
                title="Delete purchase indent"
                aria-label={`Delete ${row.indentNo}`}
                onClick={() => setIndentToDelete(row)}
                className="rounded p-1.5 text-gray-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      />
      <Pagination
        currentPage={currentPage}
        totalItems={pagination.total}
        itemsPerPage={itemsPerPage}
        offset={pagination.offset}
        hasNext={pagination.next}
        hasPrev={pagination.prev}
        onPageChange={handlePageChange}
      />
      <Modal
        isOpen={Boolean(indentToDelete)}
        onClose={() => {
          if (!isDeleting) setIndentToDelete(null);
        }}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Delete purchase indent <span className="font-semibold">{indentToDelete?.indentNo}</span>
            {indentToDelete?.status === "Pending approval"
              ? " and remove it from the approval queue"
              : ""}
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIndentToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmDelete} disabled={isDeleting || !companyId} className="bg-red-600 text-white hover:bg-red-700">
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
