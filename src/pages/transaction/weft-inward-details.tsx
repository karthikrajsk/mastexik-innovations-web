import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { formatDate } from "@/lib/utils";
import { AppDispatch, RootState } from "@/state/store";
import { getAllWeavingJobWorkOrders, getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllCustomers } from "@/state/customerSlice";
import { deleteWeftInward, getAllWeftInwards, getWeftInwardsByFactoryCompanyId } from "@/state/weftInwardSlice";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function WeftInwardDetails() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { list, pagination } = useSelector((state: RootState) => state.weftInward as any);
  const { weavingJobWorkOrderList } = useSelector((state: RootState) => state.weavingJobWorkOrder as any);
  const { vendorList } = useSelector((state: RootState) => state.vendor as any);
  const { subCategoryList } = useSelector((state: RootState) => state.subCategory as any);
  const { companyMasterList } = useSelector((state: RootState) => (state as any).companyMaster);
  const { customerList } = useSelector((state: RootState) => state.customer as any);

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
    dispatch(getAllWeavingJobWorkOrders({ fetchAll: true } as any));
    dispatch(getAllWeavingContract({fetchAll: true} as any));
    dispatch(getAllVendors({fetchAll: true} as any));
    dispatch(getAllSubCategories({fetchAll: true} as any));
    dispatch(getAllCompanies({fetchAll: true} as any));
    dispatch(getAllCustomers({ fetchAll: true } as any));
  }, [dispatch]);

  useEffect(() => {
    if (!companyInitialized) return;
    const payload = { offset: getOffset(), limit: itemsPerPage } as any;
    if (companyId) {
      dispatch(getWeftInwardsByFactoryCompanyId({ companyId, fetchAll: true }) as any);
    } else {
      dispatch(getAllWeftInwards({ fetchAll: true } as any));
    }
  }, [dispatch, companyInitialized, companyId, currentPage, getOffset, itemsPerPage]);

  const processed = useMemo(() => {
    const arr = Array.isArray(list) ? list : [];
    const baseSerial = pagination?.offset || 0;
    return arr.map((x: any, idx: number) => ({ ...x, serialNo: baseSerial + idx + 1 }));
  }, [list, pagination?.offset]);

  const jobWorkOrderMap = useMemo(() => {
    const raw: any[] = Array.isArray(weavingJobWorkOrderList) ? weavingJobWorkOrderList : Array.isArray(weavingJobWorkOrderList?.data) ? weavingJobWorkOrderList.data : [];
    const map = new Map<string, any>();
    raw.forEach((w: any) => {
      const label = w?.jobWorkOrderNo || w?.weavingJobWorkOrderNo || w?.weavingWorkOrderNo || w?.weavingWorkOrderNumber || w?.jobWorkOrderNumber;
      const tradingCompanyId = w?.tradingCompanyId || w?.buyerId;
      if (w?.id != null) {
        map.set(String(w.id), { label: label || '', tradingCompanyId });
      }
    });
    return map;
  }, [weavingJobWorkOrderList]);

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
    arr.forEach((cust: any) => {
      if (cust?.id != null) {
        const name = cust.customerName || cust.customerNameEn || cust.customerNameEnglish || cust.name || '';
        if (name) map.set(String(cust.id), name);
      }
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
      // Cell: ({ value }: { value: string }) => formatDate(value),
    },
    { Header: "Inward No", accessor: (row: any) => row?.inwardNo || row?.weftInwardNo || row?.documentNo || "-" },
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
      Header: "Job Work Order No/Buyer",
      accessor: (row: any) => {
        const direct = row?.jobWorkOrderNo || row?.weavingJobWorkOrderNo || row?.weavingWorkOrderNo;
        const id = row?.weavingWorkOrderId || row?.weavingJobWorkOrderId;
        const mapped = id != null ? jobWorkOrderMap.get(String(id)) : undefined;
        
        let workOrderNo = direct;
        if (!workOrderNo) {
          if (mapped?.label) {
            workOrderNo = mapped.label;
          } else if (id != null) {
            workOrderNo = String(id);
          }
        }
        
        const orderTypeId = Number(row?.orderTypeId);
        let buyerName = '';

        if (orderTypeId === 1) {
          const tId = row?.tradingCompanyId ?? mapped?.tradingCompanyId;
          buyerName = tId != null ? (companyNameMap.get(String(tId)) || '') : '';
        } else if (orderTypeId === 2) {
          const cId = row?.buyerId ?? row?.customerId ?? row?.tradingCompanyId ?? mapped?.tradingCompanyId;
          buyerName = cId != null ? (customerNameMap.get(String(cId)) || '') : '';
        } else {
          const companyCandidateId = row?.tradingCompanyId ?? mapped?.tradingCompanyId ?? row?.factoryCompanyId ?? row?.companyId;
          const customerCandidateId = row?.buyerId ?? row?.customerId ?? row?.tradingCompanyId ?? mapped?.tradingCompanyId;
          if (companyCandidateId != null) {
            buyerName = companyNameMap.get(String(companyCandidateId)) || '';
          }
          if (!buyerName && customerCandidateId != null) {
            buyerName = customerNameMap.get(String(customerCandidateId)) || '';
          }
        }
        
        const base = workOrderNo || '-';
        return buyerName ? `${base} - ${buyerName}` : base;
      },
    },
    {
      Header: "Actual Yarn",
      accessor: (row: any) => {
        const items = row?.yarnDetails || row?.items || [];
        const first = Array.isArray(items) ? items[0] : undefined;
        return first?.actualYarn || first?.yarnCount || "-";
      }
    },
    {
      Header: "Mill Name",
      accessor: (row: any) => {
        const items = row?.yarnDetails || row?.items || [];
        const first = Array.isArray(items) ? items[0] : undefined;
        const id = first?.millId ?? row?.millId;
        return row?.millName || millName(id) || "-";
      },
    },
  ], [jobWorkOrderMap, millMap, subCategoryList, companyNameMap, customerNameMap]);

  const handleAdd = () => {
    try { sessionStorage.removeItem('weftInwardEdit'); } catch {}
    navigate("/transaction/weft-inward", { state: { isExternalMode: true } });
  };

  const handleEdit = (row: any) => {
    try { sessionStorage.setItem('weftInwardEdit', JSON.stringify(row)); } catch {}
    navigate("/transaction/weft-inward", { state: { weftInwardDtl: row } });
  };

  const handleDelete = (row: any) => {
    setCurrentRow(row);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentRow) return;
    try {
      if (companyId) {
        await dispatch(deleteWeftInward({ id: currentRow.id, factoryCompanyId: companyId }) as any).unwrap();
      } else {
        await dispatch(deleteWeftInward(currentRow.id) as any).unwrap();
      }

      const currentTotal = pagination?.total || 0;
      const updatedTotal = Math.max(0, currentTotal - 1);
      const maxPage = Math.max(0, Math.ceil(updatedTotal / itemsPerPage) - 1);

      if (currentPage > maxPage) {
        handlePageChange(maxPage);
      } else {
        const payload = { offset: getOffset(), limit: itemsPerPage } as any;
        if (companyId) {
          await dispatch(getWeftInwardsByFactoryCompanyId({ companyId, ...payload }) as any);
        } else {
          await dispatch(getAllWeftInwards(payload));
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
        title="Weft Inward"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        showActions={true}
        filterPlaceholder="Search weft inward..."
        showColumnFilters={true}
        disableFullDataFetch={true}
        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        // totalCount={pagination?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
      />

      {/* <Pagination
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
