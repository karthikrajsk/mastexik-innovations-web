import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { formatDate } from "@/lib/utils";
import { AppDispatch, RootState } from "@/state/store";
import { fetchDispatchRegister, fetchScanDispatchesByCompany, setFormData, deleteScanDispatchByCompany } from "@/state/scanDispatchSlice";
import { getAllFabricMastersForDropdown } from "@/state/fabricMasterSlice";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function ScanDispatchRegister() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { registerRecords, registerLoading, pagination, completedInvoices } = useSelector(
    (state: RootState) => state.scanDispatch
  );

  const { fabricMasterFullList } = useSelector((state: RootState) => state.fabricMaster);

  const [searchTerm, setSearchTerm] = useState("");
  const [buyerFilter, setBuyerFilter] = useState<number | "">("");
  const [invoiceFilter, setInvoiceFilter] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<any | null>(null);

  const [companyId, setCompanyId] = useState<number | null>(null);
  const [companyInitialized, setCompanyInitialized] = useState(false);

  const { currentPage, itemsPerPage, handlePageChange, getOffset, setItemsPerPage } = usePagination({
    itemsPerPage: 10,
  });

  // ────────────────────────────────────────────────
  // Initial load – only fetch what we really need
  // ────────────────────────────────────────────────
  useEffect(() => {
    const storedCompanyId = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const factoryCompanyId = storedCompanyId ? Number(storedCompanyId) : null;
    setCompanyId(factoryCompanyId);
    setCompanyInitialized(true);

    dispatch(getAllFabricMastersForDropdown());
    dispatch(setFormData({ invoiceId: undefined, invoiceNo: "", orderId: undefined, orderNo: "", rolls: [], summary: [] }));
  }, [dispatch]);

  useEffect(() => {
    if (!companyInitialized) return;

    const offset = getOffset();
    const limit = itemsPerPage;
    const search = searchTerm.trim() || undefined;
    const payload = { offset, limit, search };

    // If your backend supports buyer/invoice filter → add them here
    // if (buyerFilter)    payload.buyerId    = buyerFilter;
    // if (invoiceFilter)  payload.invoiceNo = invoiceFilter;

    if (companyId) {
      dispatch(fetchScanDispatchesByCompany({ companyId, ...payload }) as any);
      return;
    }

    dispatch(fetchDispatchRegister(payload as any));
  }, [
    dispatch,
    companyInitialized,
    companyId,
    currentPage,
    itemsPerPage,
    getOffset,
    searchTerm,
    buyerFilter,     // ← only if backend supports
    invoiceFilter,   // ← only if backend supports
    // completedInvoices.length,  // ← usually not needed for re-fetch
  ]);

  const fabricMasterLookup = useMemo(() => {
    const fabricList = Array.isArray(fabricMasterFullList) ? fabricMasterFullList : [];
    return fabricList.reduce<Record<number, { fabricCode: string; fabricQuality: string }>>((acc, fabric: any) => {
      if (fabric?.id) {
        acc[fabric.id] = {
          fabricCode: fabric.fabricCode || '',
          fabricQuality: fabric.fabricQuality || '',
        };
      }
      return acc;
    }, {});
  }, [fabricMasterFullList]);

  const processed = useMemo(() => {
    const arr = Array.isArray(registerRecords) ? registerRecords : [];
    const baseSerial = pagination?.offset || 0;
    return arr.map((x: any, idx: number) => ({
      ...x,
      serialNo: baseSerial + idx + 1,
    }));
  }, [registerRecords, pagination?.offset]);

  const columns = useMemo(
    () => [
      { Header: "S.No", accessor: "serialNo", width: 60, disableFilters: true },
      { Header: "Buyer Name", accessor: "buyerName" },
      { Header: "Sales Order No", accessor: "orderNo" },
      { Header: "Invoice No", accessor: "invoiceNo" },
      {
        Header: "Packing List No(s)",
        accessor: (row: any) => {
          const packingNos = new Set<string>();
          
          if (Array.isArray(row.rolls)) {
            row.rolls.forEach((roll: any) => {
              if (roll.packingListNo) packingNos.add(roll.packingListNo);
            });
          }
          
          if (Array.isArray(row.summary) && packingNos.size === 0) {
            row.summary.forEach((sum: any) => {
              if (sum.packingListNo) packingNos.add(sum.packingListNo);
            });
          }
          
          return packingNos.size > 0 ? Array.from(packingNos).join(", ") : "-";
        },
      },
      {
        Header: "Sort No / Construction",
        accessor: (row: any) => {
          const fabricId = row.fabricMasterId;
          if (!fabricId) return "-";
          
          const fabric = fabricMasterLookup[fabricId];
          if (!fabric) return "-";
          
          const parts = [];
          if (fabric.fabricCode) parts.push(fabric.fabricCode);
          if (fabric.fabricQuality) parts.push(fabric.fabricQuality);
          
          return parts.length > 0 ? parts.join(" / ") : "-";
        },
      },
      {
        Header: "Last Scanned",
        accessor: (row: any) => row?.lastScannedAt || row?.updatedAt || "",
        Cell: ({ value }: { value: string }) => (value ? formatDate(value) : "-"),
      },
    ],
    [fabricMasterLookup]
  );

  const handleAdd = () => {
    navigate("/transaction/scan-dispatch-entry");
  };

  const handleEdit = (row: any) => {
    navigate("/transaction/scan-dispatch-entry", {
      state: {
        invoiceId: row.invoiceId,
        buyerId: row.buyerId,
        editMode: true,
        scanDispatchData: {
          id: row.id,
          fabricMasterId: row.fabricMasterId,
          rolls: row.rolls || [],
          summary: row.summary || [],
          orderId: row.orderId,
          orderNo: row.orderNo,
        },
      },
    });
  };

  const handleDelete = (row: any) => {
    setCurrentRow(row);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentRow?.id || !companyId) return;
    try {
      await dispatch(deleteScanDispatchByCompany({ id: currentRow.id, companyId })).unwrap();
      
      if (currentRow.invoiceId && typeof window !== 'undefined') {
        const storageKey = `scan-dispatch-status-${currentRow.invoiceId}`;
        window.localStorage.removeItem(storageKey);
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="p-6 pt-16">
      <DataTable
        columns={columns}
        data={processed}
        title="Scan & Dispatch Register"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        showActions={true}
        filterPlaceholder="Search buyer, invoice, order..."
        showColumnFilters={true}
        initialPageSize={itemsPerPage}
        onPageSizeChange={setItemsPerPage}
        loading={registerLoading}
      />

      <Pagination
        currentPage={currentPage}
        totalItems={pagination?.total || 0}
        itemsPerPage={itemsPerPage}
        offset={pagination?.offset || 0}
        hasNext={!!pagination?.next}
        hasPrev={!!pagination?.prev}
        onPageChange={handlePageChange}
      />

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete this dispatch entry?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={confirmDelete} className="btn btn-danger">
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}