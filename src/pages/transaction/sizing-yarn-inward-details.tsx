import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { formatDate } from "@/lib/utils";
import { AppDispatch, RootState } from "@/state/store";
import { getAllSizingJobWorkOrders, getAllSizingJobWorkOrdersByFactoryCompanyId } from "@/state/sizingJobWorkOrderSlice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { deleteSizingYarnInward, getAllSizingYarnInwards, getSizingYarnInwardsByFactoryCompanyId } from "@/state/sizingYarnInwardSlice";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function SizingYarnInwardDetails() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { list, pagination } = useSelector((state: RootState) => state.sizingYarnInward as any);
  const { sizingJobWorkOrderList } = useSelector((state: RootState) => state.sizingJobWorkOrder as any);
  const { vendorList } = useSelector((state: RootState) => state.vendor as any);
  const { customerList } = useSelector((state: RootState) => (state as any).customer);
  const { subCategoryList } = useSelector((state: RootState) => state.subCategory as any);
  const { companyMasterList } = useSelector((state: RootState) => (state as any).companyMaster);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<any | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [companyInitialized, setCompanyInitialized] = useState(false);
  const { currentPage, itemsPerPage, handlePageChange, getOffset,setItemsPerPage } = usePagination({ itemsPerPage: 10 });

  useEffect(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const factoryCompanyId = storedCompanyId ? Number(storedCompanyId) : null;
    setCompanyId(factoryCompanyId);
    setCompanyInitialized(true);
    if (factoryCompanyId) {
      dispatch(getAllSizingJobWorkOrdersByFactoryCompanyId({ factoryCompanyId }) as any);
    } else {
      dispatch(getAllSizingJobWorkOrders({} as any));
    }
    dispatch(getAllVendors({fetchAll: true} as any));
    dispatch(getAllSubCategories({fetchAll: true} as any));
    dispatch(getAllCompanies({fetchAll: true} as any));
  }, [dispatch]);

  useEffect(() => {
    if (!companyInitialized) return;
    const payload = { offset: getOffset(), limit: itemsPerPage } as any;
    if (companyId) {
      dispatch(getSizingYarnInwardsByFactoryCompanyId({ companyId, fetchAll: true }) as any);
    } else {
      dispatch(getAllSizingYarnInwards(payload));
    }
  }, [dispatch, companyInitialized, companyId, currentPage, getOffset, itemsPerPage]);

  const processed = useMemo(() => {
    const arr = Array.isArray(list) ? list : [];
    const baseSerial = pagination?.offset || 0;

    return arr.map((x: any, idx: number) => ({ ...x, serialNo: baseSerial + idx + 1, }));
  }, [list, pagination?.offset]);

  const jobWorkOrderMap = useMemo(() => {
    const raw: any[] = Array.isArray(sizingJobWorkOrderList)
      ? sizingJobWorkOrderList
      : Array.isArray(sizingJobWorkOrderList?.data)
        ? sizingJobWorkOrderList.data
        : [];
    const map = new Map<string, { orderNo: string; orderTypeId?: number; tradingCompanyId?: number; buyerId?: number }>();
    raw.forEach((order: any) => {
      const id = order?.id ?? order?.sizingJobWorkOrderId;
      if (id == null) return;
      const orderNo = order?.sizingWorkOrderNo || order?.sizingJobWorkOrderNo || order?.jobWorkOrderNo || `SO-${id}`;
      map.set(String(id), {
        orderNo,
        orderTypeId: order?.orderTypeId != null ? Number(order.orderTypeId) : undefined,
        tradingCompanyId: order?.tradingCompanyId ?? order?.factoryCompanyId ?? order?.buyerCompanyId ?? undefined,
        buyerId: order?.buyerId ?? order?.customerId ?? order?.consigneeId ?? undefined,
      });
    });
    return map;
  }, [sizingJobWorkOrderList]);

  const companyNameMap = useMemo(() => {
    const raw: any = companyMasterList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, string>();
    arr.forEach((c: any) => {
      if (c?.id != null) map.set(String(c.id), String(c.companyName || c.name || ''));
    });
    return map;
  }, [companyMasterList]);

  const customerNameMap = useMemo(() => {
    const raw: any = customerList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, string>();
    arr.forEach((c: any) => {
      if (c?.id != null) map.set(String(c.id), String(c.customerName || c.name || ''));
    });
    return map;
  }, [customerList]);

  const millMap = useMemo(() => {
    const raw: any[] = Array.isArray(subCategoryList) ? subCategoryList : Array.isArray(subCategoryList?.data) ? subCategoryList.data : [];
    const map = new Map<string, string>();
    raw.forEach((sc: any) => {
      if ((sc?.categoryName || '').toLowerCase() === 'mill' && sc?.id != null) {
        map.set(String(sc.id), String(sc.subCategoryName || ''));
      }
    });
    return map;
  }, [subCategoryList]);

  const millName = (id: number | string) => {
    if (id == null) return "-";
    return millMap.get(String(id)) || "-";
  };

  const columns = useMemo(() => [
    { Header: "S.No", accessor: "serialNo", width: 50, disableFilters: true },
    {
      Header: "Inward Date",
      accessor: (row: any) => row?.inwardDate || row?.createdAt || row?.date || "",
      Cell: ({ value }: { value: string }) => {
                      if (!value) return 'N/A';
                      const date = new Date(value);
                      const day = date.getDate().toString().padStart(2, '0');
                      const month = (date.getMonth() + 1).toString().padStart(2, '0');
                      const year = date.getFullYear();
                      return `${day}/${month}/${year}`;
                    },
                    Filter: DateRangeFilter, },
    
    { Header: "Inward No", accessor: (row: any) => row?.inwardNo || row?.sizingYarnInwardNo || row?.documentNo || "-" },
    {
      Header: "Order Type",
      accessor: (row: any) => {
        const orderTypeId = Number(row?.orderTypeId);
        if (orderTypeId === 1) return "Internal";
        if (orderTypeId === 2) return "External";
        return "-";
      },
    },
    {
      Header: "Sizing Order No/Buyer",
      accessor: (row: any) => {
        const orderIdCandidates = [
          row?.sizingJobWorkOrderId,
          row?.sizingWorkOrderId,
          row?.weavingWorkOrderId,
          row?.weavingJobWorkOrderId,
        ];
        const resolvedOrderId = orderIdCandidates.find((value) => value != null);
        let workOrderNo =
          row?.sizingJobWorkOrderNo ||
          row?.sizingWorkOrderNo ||
          row?.jobWorkOrderNo ||
          row?.weavingJobWorkOrderNo ||
          row?.weavingWorkOrderNo;
        const currentOrderType = row?.orderTypeId != null ? Number(row.orderTypeId) : undefined;
        let buyerId = currentOrderType === 1 ? row?.tradingCompanyId : row?.buyerId;
        let effectiveOrderType = currentOrderType;

        if (!workOrderNo && resolvedOrderId != null) {
          const mapped = jobWorkOrderMap.get(String(resolvedOrderId));
          if (mapped) {
            workOrderNo = mapped.orderNo || String(resolvedOrderId);
            if (!buyerId) {
              const mappedOrderType = mapped.orderTypeId != null ? Number(mapped.orderTypeId) : undefined;
              const targetType = effectiveOrderType ?? mappedOrderType;
              if (targetType === 1) {
                buyerId = mapped.tradingCompanyId;
              } else if (targetType === 2) {
                buyerId = mapped.buyerId;
              }
              if (effectiveOrderType == null && targetType != null) {
                effectiveOrderType = targetType;
              }
            }
          } else {
            workOrderNo = String(resolvedOrderId);
          }
        }

        const base = workOrderNo || "-";
        if (!buyerId) return base;
        const buyerLabel =
          effectiveOrderType === 2
            ? customerNameMap.get(String(buyerId)) || ""
            : companyNameMap.get(String(buyerId)) || "";
        return buyerLabel ? `${base} - ${buyerLabel}` : base;
      },
    },
    {
      Header: "Yarn Name",
      accessor: (row: any) => {
        const items = Array.isArray(row?.yarnDetails)
          ? row.yarnDetails
          : Array.isArray(row?.items)
            ? row.items
            : [];
        const seen = new Set<string>();
        const labels = items
          .map((item: any) => item?.yarnName || item?.actualYarn || item?.yarnCount || "")
          .map((label: string) => label.trim())
          .filter((label: string) => {
            if (!label) return false;
            if (seen.has(label)) return false;
            seen.add(label);
            return true;
          });
        return labels.length ? labels.join(", ") : "-";
      }
    },
  ], [jobWorkOrderMap, subCategoryList, companyNameMap, customerNameMap]);

  const handleAdd = () => {
    try { sessionStorage.removeItem('sizingYarnInwardEdit'); } catch {}
    navigate("/transaction/sizing-yarn-inward", { state: { isExternalMode: true } });
  };

  const handleEdit = (row: any) => {
    try { sessionStorage.setItem('sizingYarnInwardEdit', JSON.stringify(row)); } catch {}
    navigate("/transaction/sizing-yarn-inward", { state: { sizingYarnInwardDtl: row } });
  };

  const handleDelete = (row: any) => {
    setCurrentRow(row);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentRow) return;
    try {
      if (companyId) {
        await dispatch(deleteSizingYarnInward({ id: currentRow.id, factoryCompanyId: companyId }) as any).unwrap();
      } else {
        await dispatch(deleteSizingYarnInward(currentRow.id) as any).unwrap();
      }

      const currentTotal = pagination?.total || 0;
      const updatedTotal = Math.max(0, currentTotal - 1);
      const maxPage = Math.max(0, Math.ceil(updatedTotal / itemsPerPage) - 1);

      if (currentPage > maxPage) {
        handlePageChange(maxPage);
      } else {
        const payload = { offset: getOffset(), limit: itemsPerPage } as any;
        if (companyId) {
          await dispatch(getSizingYarnInwardsByFactoryCompanyId({ companyId, ...payload }) as any);
        } else {
          await dispatch(getAllSizingYarnInwards(payload));
        }
      }
    } catch {}
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="p-6 pt-16">
      <DataTable
        columns={columns}
        data={processed}
        title="Sizing Yarn Inward"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        showActions={true}
        filterPlaceholder="Search sizing yarn inward..."
        showColumnFilters={true}
        //   initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        //    totalCount={pagination?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
        disableFullDataFetch={true}
      />
{/* 
      <Pagination
        currentPage={currentPage}
        totalItems={pagination?.total || 0}
        itemsPerPage={itemsPerPage}
        offset={pagination?.offset || 0}
        hasNext={!!pagination?.next}
        hasPrev={!!pagination?.prev}
        onPageChange={handlePageChange}
      /> */}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this record?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
