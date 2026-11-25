//sizing beam outward

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { AppDispatch, RootState } from "@/state/store";
import { getAllSizingBeamOutward } from "@/state/sizingBeamOutwardSlice";
import { getAllSizingJobWorkOrders, getAllSizingJobWorkOrdersByFactoryCompanyId } from "@/state/sizingJobWorkOrderSlice";
import { getAllSizingPlan } from "@/state/sizingPlanSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { extractArray, formatNumber, resolveOrderLabel, resolvePlanLabel, resolveBuyerName } from "@/pages/transaction/sizing-beam-outward-shared";
import { formatDate } from "@/lib/utils";

const resolveSelectedCompanyId = () => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    if (!stored) return null;
    const numeric = Number(stored);
    if (Number.isFinite(numeric)) return numeric;
    const parsed = JSON.parse(stored);
    if (parsed?.id != null && Number.isFinite(Number(parsed.id))) {
      return Number(parsed.id);
    }
    return null;
  } catch {
    return null;
  }
};

interface ViewDetailRow {
  serialNo: number;
  sizedBeamNo: string;
  width: string;
  totalEnds: string;
  beamMeters: string;
  flangeNo: string;
  weavingContractNo: string;
  salesOrderNo: string;
}

export function SizingBeamOutward() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const sizingBeamOutwardState = useSelector((state: RootState) => (state as any).sizingBeamOutward || {});
  const { sizingBeamOutwardList, pagination } = sizingBeamOutwardState;
  const { sizingJobWorkOrderList } = useSelector((state: RootState) => state.sizingJobWorkOrder as any);
  const { sizingPlanList } = useSelector((state: RootState) => state.sizingPlan as any);
  const { currentPage, itemsPerPage, handlePageChange, getOffset, setItemsPerPage } = usePagination({ itemsPerPage: 10 });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [selectedCompanyId] = useState<number | null>(() => resolveSelectedCompanyId());

  // useEffect(() => {
  //   dispatch(getAllSizingBeamOutward({ offset: getOffset(), limit: itemsPerPage, companyId: selectedCompanyId ?? undefined }));
  // }, [dispatch, getOffset, itemsPerPage, currentPage, selectedCompanyId]);

   useEffect(() => {
    dispatch(getAllSizingBeamOutward({ fetchAll: true, companyId: selectedCompanyId ?? undefined }));
  }, [dispatch,selectedCompanyId]);

  useEffect(() => {
    if (selectedCompanyId) {
      dispatch(getAllSizingJobWorkOrdersByFactoryCompanyId({ factoryCompanyId: selectedCompanyId } as any));
      dispatch(getAllSizingPlan({ fetchAll: true, companyId: selectedCompanyId } as any));
    } else {
      dispatch(getAllSizingJobWorkOrders(undefined as any));
      dispatch(getAllSizingPlan({ fetchAll: true } as any));
    }
  }, [dispatch, selectedCompanyId]);

  const safeSizingList = useMemo(() => extractArray(sizingBeamOutwardList), [sizingBeamOutwardList]);

  const orderMetaMap = useMemo(() => {
    const map = new Map<string, { orderNo: string; buyerName: string; orderType: string; yarnName: string }>();
    extractArray(sizingJobWorkOrderList).forEach((order: any) => {
      const id = order?.id ?? order?.sizingJobWorkOrderId ?? order?.sizingPlanId;
      if (id == null) return;
      const orderNo = resolveOrderLabel(order);
      const buyerName = resolveBuyerName(order, "-");
      const yarnName = order?.yarnName || order?.warpYarnName || order?.yarnType || "-";
      const rawOrderType = String(order?.orderType || order?.orderTypeName || "Internal");
      map.set(String(id), {
        orderNo: orderNo || `SO-${id}`,
        buyerName,
        orderType: rawOrderType.toLowerCase().includes("external") ? "External" : "Internal",
        yarnName,
      });
    });
    return map;
  }, [sizingJobWorkOrderList]);

  const planMetaMap = useMemo(() => {
    const map = new Map<string, { planNo: string; buyerName: string }>();
    extractArray(sizingPlanList).forEach((plan: any) => {
      const id = plan?.id ?? plan?.sizingPlanId;
      if (id == null) return;
      map.set(String(id), {
        planNo: resolvePlanLabel(plan) || `PLAN-${id}`,
        buyerName: resolveBuyerName(plan, "-"),
      });
    });
    return map;
  }, [sizingPlanList]);

  const tableData = useMemo(() => {
    const baseSerial = pagination?.offset || 0;
    return safeSizingList.map((entry: any, index: number) => {
      const orderMeta = entry?.sizingOrderId ? orderMetaMap.get(String(entry.sizingOrderId)) : undefined;
      const planMeta = entry?.sizingPlanId ? planMetaMap.get(String(entry.sizingPlanId)) : undefined;
      const summary = entry?.summary || entry?.beamSummary || {};
      const totalEnds = entry?.totalEnds ?? summary.totalEnds;
      const totalBeamMeters = entry?.totalBeamMeters ?? summary.totalBeamMeters;
      const noOfBeams = entry?.noOfBeams ?? summary.noOfBeams ?? extractArray(entry?.beamDetails).length;
      const docNumber = entry?.sizingBeamOutwardNo || entry?.documentNo || "-";
      const outwardDateValue = entry?.outwardDate ?? entry?.date ?? entry?.createdAt ?? entry?.documentDate ?? "";
      return {
        ...entry,
        serialNo: baseSerial + index + 1,
        sizingBeamOutwardNo: docNumber,
        outwardDate: outwardDateValue,
        orderType: entry?.orderType || orderMeta?.orderType || (planMeta ? "Internal" : "External"),
        sizingOrderNo: entry?.sizingOrderNo || orderMeta?.orderNo || "-",
        sizingPlanNo: entry?.sizingPlanNo || planMeta?.planNo || "-",
        buyerName: entry?.buyerName || planMeta?.buyerName || orderMeta?.buyerName || "-",
        yarnName: entry?.yarnName || orderMeta?.yarnName || "-",
        totalEndsFormatted: formatNumber(totalEnds ?? 0),
        noOfBeams: noOfBeams || 0,
        beamMetersFormatted: formatNumber(totalBeamMeters ?? 0),
      };
    });
  }, [safeSizingList, pagination?.offset, orderMetaMap, planMetaMap]);

  const columns = useMemo(
    () => [
      { Header: "S.No", accessor: "serialNo", disableFilters: true, width: 60 },
        {
        Header: "Outward Date",
        accessor: "outwardDate",
      Cell: ({ value }: { value: string }) => {
                      if (!value) return 'N/A';
                      const date = new Date(value);
                      const day = date.getDate().toString().padStart(2, '0');
                      const month = (date.getMonth() + 1).toString().padStart(2, '0');
                      const year = date.getFullYear();
                      return `${day}/${month}/${year}`;
                    },
                    Filter: DateRangeFilter,
      },
      { Header: "Sizing Beam Outward No", accessor: "sizingBeamOutwardNo" },
    
      { Header: "Order Type", accessor: "orderType" },
      { Header: "Sizing Order No", accessor: "sizingOrderNo" },
      { Header: "Sizing Plan No", accessor: "sizingPlanNo" },
      { Header: "Buyer Name", accessor: "buyerName" },
      { Header: "Yarn Name", accessor: "yarnName" },
      { Header: "Total Ends", accessor: "totalEndsFormatted" },
      { Header: "No Of Beams", accessor: "noOfBeams" },
      { Header: "Beam Meters", accessor: "beamMetersFormatted" },
    ],
    [],
  );

  const handleAdd = () => {
    navigate("/transaction/sizing-beam-outward-form");
  };

  const handleEdit = (record: any) => {
    if (!record?.id) return;
    navigate(`/transaction/sizing-beam-outward-form/${record.id}`);
  };

  const handleView = (record: any) => {
    setViewRecord(record);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewRecord(null);
  };

  const viewDetails = useMemo<ViewDetailRow[]>(() => {
    if (!viewRecord) return [];
    return extractArray(viewRecord.beamDetails).map((detail: any, index: number) => ({
      serialNo: index + 1,
      sizedBeamNo: detail?.sizedBeamNo ? String(detail.sizedBeamNo) : "-",
      width: detail?.width != null ? String(detail.width) : detail?.fabricPanelWidth != null ? String(detail.fabricPanelWidth) : "-",
      totalEnds: detail?.totalEnds != null ? String(detail.totalEnds) : "-",
      beamMeters: detail?.beamMeters != null ? String(detail.beamMeters) : "-",
      flangeNo: detail?.flangeNo ? String(detail.flangeNo) : "-",
      weavingContractNo: detail?.weavingContractNo || detail?.contractNo || "-",
      salesOrderNo: detail?.salesOrderNo || detail?.salesOrderNumber || "-",
    }));
  }, [viewRecord]);

  const summaryCards = useMemo(() => {
    if (!viewRecord) return [] as { label: string; value: string }[];
    const summary = viewRecord?.summary || viewRecord?.beamSummary || {};
    const totalEnds = viewRecord?.totalEnds ?? summary.totalEnds ?? 0;
    const totalBeamMeters = viewRecord?.totalBeamMeters ?? summary.totalBeamMeters ?? 0;
    const noOfBeams = viewRecord?.noOfBeams ?? summary.noOfBeams ?? extractArray(viewRecord?.beamDetails).length;
    return [
      { label: "No Of Beams", value: String(noOfBeams || 0) },
      { label: "Total Ends", value: formatNumber(totalEnds || 0) },
      { label: "Total Beam Meters", value: formatNumber(totalBeamMeters || 0) },
    ];
  }, [viewRecord]);

  return (
    <div className="p-6 pt-16 space-y-6">
      <DataTable
        columns={columns}
        data={tableData}
        title="Sizing Beam Outward"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        showActions
        showColumnFilters
        filterPlaceholder="Search Sizing Beam Outward..."
        disableFullDataFetch = {true}
        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
      />
      {/* <Pagination
        currentPage={currentPage}
        totalItems={pagination?.total || tableData.length}
        itemsPerPage={itemsPerPage}
        offset={pagination?.offset || 0}
        hasNext={!!pagination?.next}
        hasPrev={!!pagination?.prev}
        onPageChange={handlePageChange}
      /> */}

      <Modal isOpen={isViewModalOpen} onClose={closeViewModal} title="Sizing Beam Outward Details" className="w-full max-w-4xl">
        {viewRecord && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-gray-500">Order Type</p>
                <p className="font-semibold">{viewRecord.orderType || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Sizing Order No</p>
                <p className="font-semibold">{viewRecord.sizingOrderNo || orderMetaMap.get(String(viewRecord.sizingOrderId || ""))?.orderNo || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Sizing Plan No</p>
                <p className="font-semibold">{viewRecord.sizingPlanNo || planMetaMap.get(String(viewRecord.sizingPlanId || ""))?.planNo || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Buyer Name</p>
                <p className="font-semibold">{viewRecord.buyerName || planMetaMap.get(String(viewRecord.sizingPlanId || ""))?.buyerName || orderMetaMap.get(String(viewRecord.sizingOrderId || ""))?.buyerName || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Yarn Name</p>
                <p className="font-semibold">{viewRecord.yarnName || orderMetaMap.get(String(viewRecord.sizingOrderId || ""))?.yarnName || "-"}</p>
              </div>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full border text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">S.No</th>
                    <th className="border px-2 py-1">Sized Beam No</th>
                    <th className="border px-2 py-1">Width</th>
                    <th className="border px-2 py-1">Total Ends</th>
                    <th className="border px-2 py-1">Beam Meters</th>
                    <th className="border px-2 py-1">Empty Beam No</th>
                    <th className="border px-2 py-1">Weaving Contract No</th>
                    <th className="border px-2 py-1">Sales Order No</th>
                  </tr>
                </thead>
                <tbody>
                  {viewDetails.map((detail) => (
                    <tr key={detail.serialNo} className="odd:bg-white even:bg-gray-50">
                      <td className="border px-2 py-1 text-center">{detail.serialNo}</td>
                      <td className="border px-2 py-1">{detail.sizedBeamNo}</td>
                      <td className="border px-2 py-1">{detail.width}</td>
                      <td className="border px-2 py-1">{detail.totalEnds}</td>
                      <td className="border px-2 py-1">{detail.beamMeters}</td>
                      <td className="border px-2 py-1">{detail.flangeNo}</td>
                      <td className="border px-2 py-1">{detail.weavingContractNo}</td>
                      <td className="border px-2 py-1">{detail.salesOrderNo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
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
