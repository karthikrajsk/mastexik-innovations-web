import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Eye, Printer } from "lucide-react";
import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { AppDispatch, RootState } from "@/state/store";
import { getAllSizingProductions } from "@/state/sizingProductionSlice";
import { getAllSizingJobWorkOrders } from "@/state/sizingJobWorkOrderSlice";
import { getAllEmployees } from "@/state/employeeSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { API_ORIGIN } from "@/services/ApiService";
import { extractArray, formatNumber, toDateInputValue } from "@/pages/transaction/sizing-production-shared";

interface ViewDetailRow {
  serialNo: number;
  shiftName: string;
  flangeNo: string;
  totalEnds: string;
  sizedBeamNo: string;
  beamMeters: string;
  breakages: string;
  rpm: string;
  tareWt: string;
  grossWt: string;
  netWt: string;
  employeeName: string;
  isSizingBeamOutward: boolean;
}

export function SizingProduction() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const sizingState = useSelector((state: RootState) => (state as any).sizingProduction || {});
  const { sizingProductionList, pagination } = sizingState;
  const { sizingJobWorkOrderList } = useSelector((state: RootState) => state.sizingJobWorkOrder as any);
  const { employeeList } = useSelector((state: RootState) => state.employee as any);
  const { customerList } = useSelector((state: RootState) => state.customer as any);
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
  const { yarnList } = useSelector((state: RootState) => state.yarn as any);
  const { currentPage, itemsPerPage, handlePageChange, getOffset, setItemsPerPage } = usePagination({ itemsPerPage: 10 });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);

  // useEffect(() => {
  //   dispatch(getAllSizingProductions({ offset: getOffset(), limit: itemsPerPage }));
  // }, [dispatch, getOffset, itemsPerPage, currentPage]);

  useEffect(() => {
    dispatch(getAllSizingProductions({ fetchAll: true } as any));
  }, [dispatch]);


  useEffect(() => {
    dispatch(getAllSizingJobWorkOrders(undefined as any));
    dispatch(getAllEmployees({ fetchAll: true } as any));
    dispatch(getAllCustomers({ fetchAll: true }));
    dispatch(getAllCompanies({ fetchAll: true }));
    dispatch(getAllYarnMasters({ fetchAll: true }));
  }, [dispatch]);

  const safeSizingList = useMemo(() => extractArray(sizingProductionList), [sizingProductionList]);

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

  const sizingOrderMap = useMemo(() => {
    const map = new Map<string, { orderNo: string; buyerName: string }>();
    const list = extractArray(sizingJobWorkOrderList);
    list.forEach((order: any) => {
      const id = order?.id ?? order?.sizingJobWorkOrderId ?? order?.sizingPlanId;
      if (id == null) return;
      const label =
        order?.sizingWorkOrderNo ||
        order?.sizingJobWorkOrderNo ||
        order?.jobWorkOrderNo ||
        order?.orderNo ||
        `SO-${id}`;

      const orderTypeId = Number(order?.orderTypeId ?? order?.orderType);
      const buyerId = order?.buyerId;
      let buyerName = "";

      if (orderTypeId === 1) {
        buyerName = (buyerId != null ? companyNameMap.get(Number(buyerId)) : null) ||
          order?.buyerName || order?.companyName || order?.factoryCompanyName || "-";
      } else if (orderTypeId === 2) {
        buyerName = (buyerId != null ? customerNameMap.get(Number(buyerId)) : null) ||
          order?.buyerName || order?.customerName || order?.consigneeName || "-";
      } else {
        buyerName = order?.buyerName || order?.customerName || order?.companyName || "-";
      }

      map.set(String(id), { orderNo: label, buyerName });
    });
    return map;
  }, [sizingJobWorkOrderList, customerNameMap, companyNameMap]);

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

  const tableData = useMemo(() => {
    const baseSerial = pagination?.offset || 0;
    return safeSizingList.map((entry: any, index: number) => {
      const sizingOrderId = entry?.sizingOrderId ? String(entry.sizingOrderId) : "";
      const orderMeta = sizingOrderMap.get(sizingOrderId);
      const summary = entry?.summary || {};
      const totalMeters = entry?.totalMeters ?? summary?.totalMeters ?? entry?.summary?.totalActualMeters;
      const totalNetWt = entry?.totalNetWeight ?? summary?.totalNetWeight ?? entry?.netWeight;
      const docNumber = entry?.sizingProductionNo || entry?.documentNo || "-";
      const yarnLookupId = entry?.yarnId ?? entry?.yarn?.id ?? entry?.summary?.yarnId ?? entry?.summary?.yarnMasterId;
      const yarnFromMap = yarnLookupId ? yarnNameMap.get(String(yarnLookupId)) : undefined;
      return {
        ...entry,
        serialNo: baseSerial + index + 1,
        sizingProductionNo: docNumber,
        sizingDate: entry?.sizingDate ? toDateInputValue(entry.sizingDate) : "",
        sizingOrderNo: entry?.sizingOrderNo || orderMeta?.orderNo || "-",
        buyerName: entry?.buyerName || orderMeta?.buyerName || "-",
        manualSetNo: entry?.manualSetNo || "-",
        yarnName: yarnFromMap || "-",
        noOfBeams: entry?.noOfBeams ?? summary?.noOfBeams ?? extractArray(entry?.productionDetails).length,
        isSizingBeamOutward: extractArray(entry?.productionDetails).some((d: any) => d.isSizingBeamOutward === 1),
        totalMetersFormatted: formatNumber(Number(totalMeters ?? 0)),
        totalNetWtFormatted: formatNumber(Number(totalNetWt ?? 0)),
      };
    });
  }, [safeSizingList, pagination?.offset, sizingOrderMap, yarnNameMap]);

  const columns = useMemo(
    () => [
      { Header: "S.No", accessor: "serialNo", disableFilters: true, width: 60 },
      {
        Header: "Sizing Date", accessor: "sizingDate", Cell: ({ value }: { value: string }) => {
          if (!value) return 'N/A';
          const date = new Date(value);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        },
        Filter: DateRangeFilter,
      },
      { Header: "Sizing Production No", accessor: "sizingProductionNo" },

      { Header: "Sizing Order No", accessor: "sizingOrderNo" },
      { Header: "Buyer Name", accessor: "buyerName" },
      { Header: "Manual Set No", accessor: "manualSetNo" },
      { Header: "Yarn Name", accessor: "yarnName" },
      { Header: "No of Beams", accessor: "noOfBeams" },
      { Header: "Total meters", accessor: "totalMetersFormatted" },
      { Header: "Net weight", accessor: "totalNetWtFormatted" },
    ],
    [],
  );

  const handleAdd = () => {
    navigate("/transaction/sizing-production-form");
  };

  const handleEdit = (record: any) => {
    if (!record?.id) return;
    navigate(`/transaction/sizing-production-form/${record.id}`);
  };

  const handleView = (record: any) => {
    setViewRecord(record);
    setIsViewModalOpen(true);
  };

  const handlePrint = (record: any) => {
    if (!record?.id) return;
    const url = `${API_ORIGIN}/api/sizing-production/${record.id}/print`;
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
      shiftName: detail?.shiftName ? String(detail.shiftName) : "-",
      flangeNo: detail?.flangeNo ? String(detail.flangeNo) : "-",
      totalEnds: detail?.totalEnds != null ? String(detail.totalEnds) : "-",
      sizedBeamNo: detail?.sizedBeamNo != null ? String(detail.sizedBeamNo) : "-",
      beamMeters: detail?.beamMeters != null ? String(detail.beamMeters) : "-",
      breakages: detail?.breakages != null ? String(detail.breakages) : "-",
      rpm: detail?.rpm != null ? String(detail.rpm) : "-",
      tareWt: detail?.tareWt != null ? String(detail.tareWt) : "-",
      grossWt: detail?.grossWt != null ? String(detail.grossWt) : "-",
      netWt: detail?.netWt != null ? String(detail.netWt) : "-",
      employeeName:
        detail?.employeeName ||
        (detail?.employeeId ? employeeMap.get(String(detail.employeeId)) || "-" : "-"),
      isSizingBeamOutward: detail?.isSizingBeamOutward === 1,
    }));
  }, [viewRecord, employeeMap]);

  const viewRecordYarnName = useMemo(() => {
    if (!viewRecord) return "-";
    const lookupId = viewRecord?.yarnId ?? viewRecord?.yarn?.id ?? viewRecord?.summary?.yarnId ?? viewRecord?.summary?.yarnMasterId;
    return viewRecord?.yarnName || (lookupId ? yarnNameMap.get(String(lookupId)) : undefined) || "-";
  }, [viewRecord, yarnNameMap]);

  const summaryCards = useMemo(() => {
    if (!viewRecord) return [] as { label: string; value: string }[];
    const summary = viewRecord.summary || {};
    const noOfBeams = viewRecord.noOfBeams ?? summary.noOfBeams ?? extractArray(viewRecord.productionDetails).length;
    const totalMeters = viewRecord.totalMeters ?? summary.totalMeters ?? 0;
    const totalNetWt = viewRecord.totalNetWeight ?? summary.totalNetWeight ?? 0;
    const sizingCount = viewRecord.sizingCount ?? summary.sizingCount ?? 0;
    return [
      { label: "No of Beams", value: String(noOfBeams || "-") },
      { label: "Total meters", value: formatNumber(Number(totalMeters || 0)) },
      { label: "Total Net WT", value: formatNumber(Number(totalNetWt || 0)) },
      { label: "Sizing Count", value: formatNumber(Number(sizingCount || 0)) },
    ];
  }, [viewRecord]);

  return (
    <div className="p-6 pt-16 space-y-6">
      <DataTable
        columns={columns}
        data={tableData}
        title="Sizing Production"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onPrint={handlePrint}
        renderActions={(record) => {
          if (record.isSizingBeamOutward) {
            return (
              <div className="flex items-center justify-end gap-2">

                <button
                  onClick={() => handleView(record)}
                  className="rounded-lg border border-blue-100 bg-blue-50/60 p-2 text-blue-600 transition hover:border-blue-200"
                  title="View"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePrint(record)}
                  className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-2 text-emerald-600 transition hover:border-emerald-200"
                  title="Print"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Outward done
                </span>
              </div>
            );
          }
          return null;
        }}
        showActions
        showColumnFilters
        filterPlaceholder="Search Sizing Production..."
        disableFullDataFetch={true}
      //  initialPageSize={itemsPerPage}
      // onPageSizeChange={setItemsPerPage}
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

      <Modal isOpen={isViewModalOpen} onClose={closeViewModal} title="Sizing Production Details" className="w-full max-w-4xl">
        {viewRecord && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-gray-500">Sizing Date</p>
                <p className="font-semibold">{viewRecord.sizingDate ? toDateInputValue(viewRecord.sizingDate) : "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Sizing Order No</p>
                <p className="font-semibold">{viewRecord.sizingOrderNo || sizingOrderMap.get(String(viewRecord.sizingOrderId || ""))?.orderNo || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Buyer Name</p>
                <p className="font-semibold">{viewRecord.buyerName || sizingOrderMap.get(String(viewRecord.sizingOrderId || ""))?.buyerName || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Manual Set No</p>
                <p className="font-semibold">{viewRecord.manualSetNo || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Machine Name</p>
                <p className="font-semibold">{viewRecord.machineName || "-"}</p>
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
                    <th className="border px-2 py-1">Shift Name</th>
                    <th className="border px-2 py-1">Empty Beam No</th>
                    <th className="border px-2 py-1">Total Ends</th>
                    <th className="border px-2 py-1">Sized Beam No</th>
                    <th className="border px-2 py-1">Beam meters</th>
                    <th className="border px-2 py-1">Breakages</th>
                    <th className="border px-2 py-1">RPM</th>
                    <th className="border px-2 py-1">TARE WT</th>
                    <th className="border px-2 py-1">GROSS WT</th>
                    <th className="border px-2 py-1">NET WT</th>
                    <th className="border px-2 py-1">Employee</th>
                    <th className="border px-2 py-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {viewDetails.map((detail) => (
                    <tr key={detail.serialNo} className="odd:bg-white even:bg-gray-50">
                      <td className="border px-2 py-1 text-center">{detail.serialNo}</td>
                      <td className="border px-2 py-1">{detail.shiftName}</td>
                      <td className="border px-2 py-1">{detail.flangeNo}</td>
                      <td className="border px-2 py-1">{detail.totalEnds}</td>
                      <td className="border px-2 py-1">{detail.sizedBeamNo}</td>
                      <td className="border px-2 py-1">{detail.beamMeters}</td>
                      <td className="border px-2 py-1">{detail.breakages}</td>
                      <td className="border px-2 py-1">{detail.rpm}</td>
                      <td className="border px-2 py-1">{detail.tareWt}</td>
                      <td className="border px-2 py-1">{detail.grossWt}</td>
                      <td className="border px-2 py-1">{detail.netWt}</td>
                      <td className="border px-2 py-1">{detail.employeeName}</td>
                      <td className="border px-2 py-1">
                        {detail.isSizingBeamOutward ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Outward done
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {summaryCards.map((card) => (
                <div key={card.label} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className="text-lg font-semibold text-gray-900">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
