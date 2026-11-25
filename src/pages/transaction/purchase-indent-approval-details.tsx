import { useEffect, useMemo, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { toast } from "react-toastify";
import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { ApprovalModal } from "@/components/modals/ApprovalModal";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { formatDate } from "@/lib/utils";
import { AppDispatch, RootState } from "@/state/store";
import {
  approvePurchaseIndent,
  getPurchaseIndents,
  PurchaseIndent,
} from "@/state/purchaseIndentSlice";

export function PurchaseIndentApprovalDetails() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const companyId = useResolvedCompanyId();

  const { purchaseIndentList, loading } = useSelector(
    (state: RootState) => state.purchaseIndent
  );

  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedIndent, setSelectedIndent] = useState<PurchaseIndent | null>(null);

  const loadData = useCallback(() => {
    if (companyId) {
      dispatch(
        getPurchaseIndents({
          offset: 0,
          limit: 1000,
          companyId,
        })
      );
    }
  }, [dispatch, companyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const aggregatedData = useMemo(() => {
    if (!purchaseIndentList || !Array.isArray(purchaseIndentList)) return [];

    return purchaseIndentList
      .filter((indent: PurchaseIndent) => {
        // Exclude drafts from approval screen; show submitted and approved indents
        return indent.status !== "Draft";
      })
      .map((indent: PurchaseIndent, index: number) => {
        const items = indent.items || [];
        const itemNames = items
          .map((item) => item.itemName)
          .filter(Boolean)
          .join(", ");
        const totalQuantity = items.reduce(
          (sum, item) => sum + (Number(item.quantity) || 0),
          0
        );

        const isApproved =
          indent.status === "Approved" ||
          indent.isApproved === 1 ||
          Boolean(indent.approveDate);

        return {
          id: indent.id,
          serialNo: index + 1,
          indentNo: indent.indentNo,
          indentDate: indent.indentDate
            ? indent.indentDate.slice(0, 10)
            : "",
          department: indent.department || "—",
          requestedBy: indent.requestedBy || "—",
          requiredDate: indent.requiredDate
            ? indent.requiredDate.slice(0, 10)
            : "",
          itemNames: itemNames || "—",
          quantity: totalQuantity || (items.length > 0 ? items.map((i) => i.quantity).join(", ") : "—"),
          priority: indent.priority || "Normal",
          status: indent.status,
          isApproved,
          approveDate: indent.approveDate,
          comments: indent.approvalComments || indent.remarks || "",
          originalIndent: indent,
        };
      });
  }, [purchaseIndentList]);

  const handleApproval = useCallback((row: any) => {
    setSelectedIndent(row.originalIndent);
    setIsApprovalModalOpen(true);
  }, []);

  const handleSaveApproval = async (approvalData: any) => {
    if (!selectedIndent) return;

    const effectiveCompanyId =
      companyId ||
      selectedIndent.companyId ||
      Number(localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany"));

    try {
      await dispatch(
        approvePurchaseIndent({
          id: selectedIndent.id,
          companyId: effectiveCompanyId,
          approveDate: approvalData.approveDate,
          comments: approvalData.comments,
          userId: approvalData.userId,
        })
      ).unwrap();

      toast.success("Purchase Indent approved successfully");
      setIsApprovalModalOpen(false);
      setSelectedIndent(null);
      loadData();
    } catch (err: any) {
      const message =
        typeof err === "string"
          ? err
          : err?.message || "Failed to approve purchase indent";
      toast.error(message);
    }
  };

  const openView = (indentId: number) => {
    navigate(`/transaction/purchase-indent-entry?id=${indentId}&mode=view`);
  };

  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: "serialNo",
        width: 50,
        disableFilters: true,
      },
      {
        Header: "Indent Date",
        accessor: "indentDate",
        Cell: ({ value }: { value?: string }) => (value ? formatDate(value) : "—"),
        Filter: DateRangeFilter,
        filter: (rows: any[], columnIds: string[], filterValue: any) => {
          if (!filterValue || (!filterValue.from && !filterValue.to)) return rows;
          return rows.filter((row) => {
            const dateStr = row.values[columnIds[0]];
            if (!dateStr) return false;
            const date = new Date(dateStr);
            if (filterValue.from) {
              const fromDate = new Date(filterValue.from);
              if (date < fromDate) return false;
            }
            if (filterValue.to) {
              const toDate = new Date(filterValue.to);
              if (date > toDate) return false;
            }
            return true;
          });
        },
      },
      {
        Header: "Indent No",
        accessor: "indentNo",
        Cell: ({ value }: { value: string }) => (
          <span className="font-semibold text-blue-700">{value || "—"}</span>
        ),
      },
      { Header: "Department", accessor: "department" },
      { Header: "Requested By", accessor: "requestedBy" },
      {
        Header: "Required Date",
        accessor: "requiredDate",
        Cell: ({ value }: { value?: string }) => (value ? formatDate(value) : "—"),
      },
      {
        Header: "Materials",
        accessor: "itemNames",
      },
      {
        Header: "Quantity",
        accessor: "quantity",
      },
      {
        Header: "Priority",
        accessor: "priority",
        Cell: ({ value }: { value: string }) => <span>{value || "Normal"}</span>,
      },
      {
        Header: "Approve Date",
        accessor: "approveDate",
        Cell: ({ value }: { value?: string }) => (value ? formatDate(value) : "—"),
      },
      {
        Header: "Approval",
        accessor: "id",
        disableFilters: true,
        Cell: (props: any) => {
          const isApproved = props.row.original.isApproved;

          if (isApproved) {
            return (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                Approved
              </span>
            );
          }

          return (
            <button
              onClick={() => handleApproval(props.row.original)}
              className="text-sm font-medium text-blue-600 underline hover:text-blue-800"
              type="button"
            >
              Approve
            </button>
          );
        },
      },
      {
        Header: "Actions",
        id: "actions",
        disableFilters: true,
        disableSorting: true,
        Cell: (props: any) => (
          <div className="flex items-center justify-center">
            <button
              type="button"
              title="View purchase indent"
              aria-label={`View ${props.row.original.indentNo}`}
              onClick={() => openView(props.row.original.id)}
              className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-blue-700"
            >
              <Eye size={16} />
            </button>
          </div>
        ),
      },
    ],
    [handleApproval]
  );

  return (
    <div className="space-y-4">
      <DataTable
        title="Purchase Indent Approval"
        columns={columns}
        data={aggregatedData}
        loading={loading}
        showColumnFilters={true}
        filterPlaceholder="Search Indent No, Department, Requester..."
        disableFullDataFetch={true}
        emptyMessage={loading ? "Loading purchase indents..." : "No purchase indents awaiting approval."}
      />

      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setSelectedIndent(null);
        }}
        onSave={handleSaveApproval}
        initialData={selectedIndent}
      />
    </div>
  );
}
