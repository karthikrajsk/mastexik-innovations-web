import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { AppDispatch, RootState } from "@/state/store";
import { getAllWarpingProductions } from "@/state/warpingProductionSlice";
import { getAllSizingJobWorkOrders } from "@/state/sizingJobWorkOrderSlice";
import { getAllMachines } from "@/state/machineMasterSlice";
import { getAllEmployees } from "@/state/employeeSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { API_ORIGIN } from "@/services/ApiService";
import { extractArray, formatNumber, toDateInputValue } from "@/pages/transaction/warping-production-shared";

interface ViewDetailRow {
  serialNo: number;
  shift: string;
  shiftName: string;
  warpBeamNo: string;
  endsPerPart: string;
  actualMeters: string;
  breakages: string;
  rpm: string;
  tareWt: string;
  grossWt: string;
  netWt: string;
  employeeName: string;
}

export function WarpingProduction() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const warpingState = useSelector((state: RootState) => (state as any).warpingProduction || {});
  const { warpingProductionList, pagination } = warpingState;
  const { machineList } = useSelector((state: RootState) => state.machineMaster as any);
  const { employeeList } = useSelector((state: RootState) => state.employee as any);
  const { sizingJobWorkOrderList } = useSelector((state: RootState) => state.sizingJobWorkOrder as any);
  const { customerList } = useSelector((state: RootState) => state.customer as any);
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
  const { yarnList } = useSelector((state: RootState) => state.yarn as any);
  const { currentPage, itemsPerPage, handlePageChange, getOffset,setItemsPerPage } = usePagination({ itemsPerPage: 10 });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);

  // useEffect(() => {
  //   dispatch(getAllWarpingProductions({ offset: getOffset(), limit: itemsPerPage }));
  // }, [dispatch, getOffset, itemsPerPage, currentPage]);
  useEffect(() => {
    dispatch(getAllWarpingProductions({ fetchAll: true } as any));
  }, [dispatch]);

  useEffect(() => {
    dispatch(getAllMachines({ fetchAll: true }));
    dispatch(getAllEmployees({ fetchAll: true }));
    dispatch(getAllSizingJobWorkOrders(undefined as any));
    dispatch(getAllCustomers({ fetchAll: true }));
    dispatch(getAllCompanies({ fetchAll: true }));
    dispatch(getAllYarnMasters({ fetchAll: true }));
  }, [dispatch]);

  const safeWarpingList = useMemo(() => extractArray(warpingProductionList), [warpingProductionList]);

  const machineOptions = useMemo(() => {
    const list = extractArray(machineList);
    return list
      .map((machine: any) => {
        const id = machine?.id ?? machine?.machineId;
        if (id == null) return null;
        const label = machine?.machineNo || machine?.machineName || `Machine ${id}`;
        return { value: String(id), label };
      })
      .filter(Boolean) as { value: string; label: string }[];
  }, [machineList]);

  const machineMap = useMemo(() => {
    const map = new Map<string, string>();
    machineOptions.forEach((option) => map.set(option.value, option.label));
    return map;
  }, [machineOptions]);

  const employeeMap = useMemo(() => {
    const map = new Map<string, string>();
    const list = extractArray(employeeList);
    list.forEach((employee: any) => {
      const id = employee?.id ?? employee?.employeeId;
      if (id == null) return;
      const label = employee?.employeeName || employee?.name || `Employee ${id}`;
      map.set(String(id), label);
    });
    return map;
  }, [employeeList]);

  const normalizedSizingOrders = useMemo(() => extractArray(sizingJobWorkOrderList), [sizingJobWorkOrderList]);

  const normalizedCustomers = useMemo(() => extractArray(customerList), [customerList]);
  const normalizedCompanies = useMemo(() => extractArray(companyMasterList), [companyMasterList]);
  const normalizedYarns = useMemo(() => extractArray(yarnList), [yarnList]);

  const customerNameMap = useMemo(() => {
    const map = new Map<number, string>();
    normalizedCustomers.forEach((customer: any) => {
      const id = customer?.id ?? customer?.customerId;
      const label = customer?.customerName || customer?.name;
      if (id == null || !label) return;
      map.set(Number(id), label);
    });
    return map;
  }, [normalizedCustomers]);

  const companyNameMap = useMemo(() => {
    const map = new Map<number, string>();
    normalizedCompanies.forEach((company: any) => {
      const id = company?.id ?? company?.companyId;
      const label = company?.companyName || company?.name;
      if (id == null || !label) return;
      map.set(Number(id), label);
    });
    return map;
  }, [normalizedCompanies]);

  const yarnNameMap = useMemo(() => {
    const map = new Map<string, string>();
    normalizedYarns.forEach((yarn: any) => {
      const id = yarn?.id ?? yarn?.yarnId ?? yarn?.yarnMasterId;
      const label = yarn?.yarnName || yarn?.name || yarn?.yarnType || yarn?.yarn || "";
      if (id == null || !label) return;
      map.set(String(id), label);
    });
    return map;
  }, [normalizedYarns]);

  const sizingOrderOptions = useMemo(() => {
    return normalizedSizingOrders
      .map((order: any) => {
        const resolvedId = order?.id ?? order?.sizingJobWorkOrderId ?? order?.sizingPlanId;
        if (resolvedId == null) return null;
        const label =
          order?.sizingWorkOrderNo ||
          order?.sizingJobWorkOrderNo ||
          order?.jobWorkOrderNo ||
          order?.orderNo ||
          `SO-${resolvedId}`;
        
        const orderTypeId = Number(order?.orderTypeId ?? order?.orderType);
        const buyerId = order?.buyerId;
        let buyerName = "";
        
        if (orderTypeId === 1) {
          buyerName = (buyerId != null ? companyNameMap.get(Number(buyerId)) : null) || 
                      order?.buyerName || order?.companyName || order?.factoryCompanyName || "";
        } else if (orderTypeId === 2) {
          buyerName = (buyerId != null ? customerNameMap.get(Number(buyerId)) : null) || 
                      order?.buyerName || order?.customerName || order?.consigneeName || "";
        } else {
          buyerName = order?.buyerName || order?.customerName || order?.companyName || "";
        }

        const parts = order?.parts ?? order?.totalParts ?? order?.numberOfParts ?? order?.partsCount ?? 0;
        const endsPerPart = order?.endsPerPart ?? order?.endsPerParts ?? order?.ends_per_part ?? 0;
        const orderYarnId = order?.yarnId ?? order?.yarn?.id ?? order?.yarnMasterId;
        const warpYarnName = yarnNameMap.get(String(orderYarnId)) || "";
        return {
          value: String(resolvedId),
          label,
          meta: { sizingOrderId: resolvedId, orderNo: label, buyerName, parts, endsPerPart, warpYarnName },
        };
      })
      .filter(Boolean) as { value: string; label: string; meta: any }[];
  }, [normalizedSizingOrders, customerNameMap, companyNameMap, yarnNameMap]);

  const sizingOrderMeta = useMemo(() => {
    const map = new Map<string, any>();
    sizingOrderOptions.forEach((option) => map.set(option.value, option.meta));
    return map;
  }, [sizingOrderOptions]);

  const tableData = useMemo(() => {
    const baseSerial = pagination?.offset || 0;
    return safeWarpingList.map((entry: any, index: number) => {
      const sizingOrderId = entry?.sizingOrderId ? String(entry.sizingOrderId) : "";
      const orderMeta = sizingOrderMeta.get(sizingOrderId || "");
      const totalMetersValue = entry?.totalMeters ?? entry?.summary?.totalActualMeters ?? entry?.summary?.totalMeters;
      const netWeightValue = entry?.netWeight ?? entry?.summary?.totalNetWeight;
      const docNumber = entry?.warpingProductionNo || entry?.documentNo || "-";
      const yarnLookupId = entry?.yarnId ?? entry?.yarn?.id ?? entry?.summary?.yarnId ?? entry?.summary?.yarnMasterId;
      const yarnFromMap = yarnLookupId ? yarnNameMap.get(String(yarnLookupId)) : undefined;
      const warpYarnLookupId = entry?.warpYarnId ?? entry?.warpYarn?.id ?? entry?.warpYarn?.yarnId;
      const warpYarnFromMap = warpYarnLookupId ? yarnNameMap.get(String(warpYarnLookupId)) : undefined;
      const warpYarnName =
        warpYarnFromMap ||
        yarnFromMap ||
        "-";
      return {
        ...entry,
        serialNo: baseSerial + index + 1,
        warpingProductionNo: docNumber,
        warpingDate: entry?.warpingDate ? toDateInputValue(entry.warpingDate) : "",
        sizingOrderNo: entry?.sizingOrderNo || entry?.sizingOrderNumber || orderMeta?.orderNo || "-",
        buyerName: entry?.buyerName || orderMeta?.buyerName || "-",
        manualSetNo: entry?.manualSetNo || "-",
        yarnName: warpYarnName || "-",
        warpYarnName,
        totalMetersFormatted: formatNumber(Number(totalMetersValue ?? 0)),
        netWeightFormatted: formatNumber(Number(netWeightValue ?? 0)),
      };
    });
  }, [safeWarpingList, pagination?.offset, sizingOrderMeta, yarnNameMap]);


  const columns = useMemo(
    () => [
      { Header: "S.No", accessor: "serialNo", disableFilters: true, width: 60 },
      { Header: "Warping Date", accessor: "warpingDate",Cell: ({ value }: { value: string }) => {
                      if (!value) return 'N/A';
                      const date = new Date(value);
                      const day = date.getDate().toString().padStart(2, '0');
                      const month = (date.getMonth() + 1).toString().padStart(2, '0');
                      const year = date.getFullYear();
                      return `${day}/${month}/${year}`;
                    },
                    Filter: DateRangeFilter, },
                          { Header: "Warping Production No", accessor: "warpingProductionNo" },

      { Header: "Sizing Order No", accessor: "sizingOrderNo" },
      { Header: "Buyer Name", accessor: "buyerName" },
      { Header: "Manual Set No", accessor: "manualSetNo" },
      { Header: "Yarn Name", accessor: "warpYarnName" },
      { Header: "Total Meters", accessor: "totalMetersFormatted" },
      { Header: "Net Weight", accessor: "netWeightFormatted" },
    ],
    [],
  );

  const handleAdd = () => {
    navigate("/transaction/warping-production-form");
  };

  const handleEdit = (record: any) => {
    if (!record?.id) return;
    navigate(`/transaction/warping-production-form/${record.id}`);
  };

  const handleView = (record: any) => {
    setViewRecord(record);
    setIsViewModalOpen(true);
  };

  const handlePrint = (record: any) => {
    if (!record?.id) return;
    const url = `${API_ORIGIN}/api/warping-production/${record.id}/print`;
    window.open(url, "_blank", "noopener,noreferrer");
  };


  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewRecord(null);
  };

  const viewDetails = useMemo<ViewDetailRow[]>(() => {
    if (!viewRecord) return [];
    return extractArray(viewRecord.productionDetails).map((detail: any, index: number) => ({
      serialNo: index + 1,
      shift: detail?.shift ? String(detail.shift) : "-",
      shiftName: detail?.shiftName ? String(detail.shiftName) : "-",
      warpBeamNo: detail?.warpBeamNo ? String(detail.warpBeamNo) : "-",
      endsPerPart: detail?.endsPerPart != null ? String(detail.endsPerPart) : "-",
      actualMeters: detail?.actualMeters != null ? String(detail.actualMeters) : "-",
      breakages: detail?.breakages != null ? String(detail.breakages) : "-",
      rpm: detail?.rpm != null ? String(detail.rpm) : "-",
      tareWt: detail?.tareWt != null ? String(detail.tareWt) : "-",
      grossWt: detail?.grossWt != null ? String(detail.grossWt) : "-",
      netWt: detail?.netWt != null ? String(detail.netWt) : "-",
      employeeName:
        detail?.employeeName ||
        detail?.employee?.employeeName ||
        (detail?.employeeId ? employeeMap.get(String(detail.employeeId)) || "-" : "-"),
    }));
  }, [viewRecord, employeeMap]);

  const viewRecordYarnName = useMemo(() => {
    if (!viewRecord) return "-";
    const lookupId = viewRecord?.yarnId ?? viewRecord?.yarn?.id ?? viewRecord?.summary?.yarnId ?? viewRecord?.summary?.yarnMasterId;
    return viewRecord?.yarnName || (lookupId ? yarnNameMap.get(String(lookupId)) : undefined) || "-";
  }, [viewRecord, yarnNameMap]);

  return (
    <div className="p-6 pt-16 space-y-6">
      <DataTable
        columns={columns}
        data={tableData}
        title="Warping Production"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onPrint={handlePrint}
        showActions
        showColumnFilters
        filterPlaceholder="Search Warping Production..."
        disableFullDataFetch = {true}
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
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        title="Warping Production Details"
        className="w-full max-w-4xl"
      >
        {viewRecord && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-gray-500">Warping Date</p>
                <p className="font-semibold">{viewRecord.warpingDate ? toDateInputValue(viewRecord.warpingDate) : "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Sizing Order No</p>
                <p className="font-semibold">{viewRecord.sizingOrderNo || viewRecord.sizingOrderNumber || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Buyer Name</p>
                <p className="font-semibold">{viewRecord.buyerName || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Manual Set No</p>
                <p className="font-semibold">{viewRecord.manualSetNo || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Machine</p>
                <p className="font-semibold">{machineMap.get(String(viewRecord.machineId)) || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Yarn Name</p>
                <p className="font-semibold">{viewRecordYarnName}</p>
              </div>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full border text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">S.No</th>
                    <th className="border px-2 py-1">Shift</th>
                    <th className="border px-2 py-1">Shift Name</th>
                    <th className="border px-2 py-1">Warp Beam No</th>
                    <th className="border px-2 py-1">Ends/Part</th>
                    <th className="border px-2 py-1">Actual meters</th>
                    <th className="border px-2 py-1">Breakages</th>
                    <th className="border px-2 py-1">RPM</th>
                    <th className="border px-2 py-1">TARE WT</th>
                    <th className="border px-2 py-1">GROSS WT</th>
                    <th className="border px-2 py-1">NET WT</th>
                    <th className="border px-2 py-1">Employee</th>
                  </tr>
                </thead>
                <tbody>
                  {viewDetails.map((detail) => (
                    <tr key={detail.serialNo} className="odd:bg-white even:bg-gray-50">
                      <td className="border px-2 py-1 text-center">{detail.serialNo}</td>
                      <td className="border px-2 py-1">{detail.shift}</td>
                      <td className="border px-2 py-1">{detail.shiftName}</td>
                      <td className="border px-2 py-1">{detail.warpBeamNo}</td>
                      <td className="border px-2 py-1">{detail.endsPerPart}</td>
                      <td className="border px-2 py-1">{detail.actualMeters}</td>
                      <td className="border px-2 py-1">{detail.breakages}</td>
                      <td className="border px-2 py-1">{detail.rpm}</td>
                      <td className="border px-2 py-1">{detail.tareWt}</td>
                      <td className="border px-2 py-1">{detail.grossWt}</td>
                      <td className="border px-2 py-1">{detail.netWt}</td>
                      <td className="border px-2 py-1">{detail.employeeName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
