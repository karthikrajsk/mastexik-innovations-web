import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { formatDate } from "@/lib/utils";
import { AppDispatch, RootState } from "@/state/store";
import { getAllSizingYarnOutward } from "@/state/sizingYarnOutwardSlice";
import { getAllSizingJobWorkOrders, getAllSizingJobWorkOrdersByFactoryCompanyId } from "@/state/sizingJobWorkOrderSlice";
import { getAllSizingPlan } from "@/state/sizingPlanSlice";
import { getAllTransports } from "@/state/transportSlice";

const extractArray = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload?.data) return extractArray(payload.data);
  return [];
};

interface OrderLookupValue {
  orderNo?: string;
  planId?: string;
  planNo?: string;
}

const resolveSelectedCompanyId = (): number | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    if (!stored) return null;
    const numeric = Number(stored);
    if (Number.isFinite(numeric)) return numeric;
    const parsed = JSON.parse(stored);
    const parsedId = parsed?.id ?? parsed?.companyId;
    if (parsedId == null) return null;
    const parsedNumber = Number(parsedId);
    return Number.isFinite(parsedNumber) ? parsedNumber : null;
  } catch {
    return null;
  }
};

const resolveOrderTypeLabel = (record: any) => {
  const raw = record?.orderType || record?.orderTypeName || record?.orderTypeLabel;
  if (typeof raw === "string" && raw.trim()) {
    const normalized = raw.toLowerCase();
    if (normalized.includes("internal")) return "Internal";
    if (normalized.includes("external")) return "External";
  }
  const id = Number(record?.orderTypeId ?? record?.orderType);
  if (id === 1) return "Internal";
  if (id === 2) return "External";
  return "-";
};

const resolveOrderNo = (record: any, orderLookup?: Map<string, OrderLookupValue>) => {
  const candidates = [
    record?.sizingOrderNo,
    record?.sizingJobWorkOrderNo,
    record?.jobWorkOrderNo,
    record?.orderNo,
    record?.sizingJobWorkOrder?.sizingWorkOrderNo,
    record?.sizingJobWorkOrder?.sizingJobWorkOrderNo,
    record?.sizingJobWorkOrder?.jobWorkOrderNo,
    record?.sizingOrder?.sizingOrderNo,
    record?.sizingOrder?.orderNo,
    record?.orderDetails?.sizingOrderNo,
  ];
  const match = candidates.find((value) => value != null && String(value).trim() !== "");
  if (match) return String(match);
  const identifier =
    record?.sizingJobWorkOrderId ??
    record?.sizingOrderId ??
    record?.sizingJobWorkOrder?.id ??
    record?.sizingOrder?.id ??
    record?.orderId;
  if (identifier != null && orderLookup?.size) {
    const lookup = orderLookup.get(String(identifier));
    if (lookup?.orderNo) return lookup.orderNo;
  }
  return identifier != null ? String(identifier) : "-";
};

const resolvePlanNo = (
  record: any,
  orderLookup?: Map<string, OrderLookupValue>,
  planLookup?: Map<string, string>,
) => {
  const candidates = [
    record?.sizingPlanNo,
    record?.planNo,
    record?.sizingPlanNumber,
    record?.sizingPlan?.sizingPlanNo,
    record?.sizingPlan?.planNo,
    record?.plan?.planNo,
    record?.planDetails?.sizingPlanNo,
  ];
  const match = candidates.find((value) => value != null && String(value).trim() !== "");
  if (match) return String(match);

  const identifier =
    record?.sizingPlanId ??
    record?.planId ??
    record?.sizingPlan?.id ??
    record?.plan?.id ??
    record?.planDetails?.sizingPlanId ??
    record?.planDetails?.planId;

  const orderIdentifier =
    record?.sizingJobWorkOrderId ??
    record?.sizingOrderId ??
    record?.sizingJobWorkOrder?.id ??
    record?.sizingOrder?.id ??
    record?.orderId;

  const orderMeta = orderIdentifier != null ? orderLookup?.get(String(orderIdentifier)) : undefined;
  const candidatePlanIds = [identifier, orderMeta?.planId].filter((value) => value != null);

  for (const planId of candidatePlanIds) {
    const key = String(planId);
    if (planLookup?.has(key)) {
      return planLookup.get(key) as string;
    }
    if (orderMeta?.planNo && orderMeta.planId === key) {
      return orderMeta.planNo;
    }
  }

  if (orderMeta?.planNo) return orderMeta.planNo;
  if (candidatePlanIds.length) return String(candidatePlanIds[0]);
  return "-";
};

const resolveBuyerName = (record: any) => {
  const candidates = [
    record?.buyerName,
    record?.customerName,
    record?.consigneeName,
    record?.companyName,
    record?.tradingCompanyName,
  ];
  const match = candidates.find((value) => value != null && String(value).trim() !== "");
  return match ? String(match) : "-";
};

const collectYarnLabels = (record: any) => {
  const details = extractArray(record?.yarnIssueDetails || record?.items || record?.details);
  if (!details.length) {
    return record?.yarnName ? String(record.yarnName) : "-";
  }
  const seen = new Set<string>();
  details.forEach((detail) => {
    const label = detail?.yarnName || detail?.alternateYarn || detail?.actualYarn;
    if (label && String(label).trim()) {
      seen.add(String(label).trim());
    }
  });
  return seen.size ? Array.from(seen).join(", ") : "-";
};

const computeIssuedQuantity = (record: any) => {
  if (record?.summary?.issuedQuantity != null) {
    return Number(record.summary.issuedQuantity) || 0;
  }
  if (record?.issuedQuantity != null) {
    return Number(record.issuedQuantity) || 0;
  }
  const details = extractArray(record?.yarnIssueDetails || record?.items || record?.details);
  if (!details.length) return 0;
  return details.reduce((sum, detail) => {
    const qty = Number(detail?.issuedQuantity ?? detail?.issueQty ?? detail?.issuedQty ?? 0);
    return sum + (Number.isFinite(qty) ? qty : 0);
  }, 0);
};

export default function SizingYarnOutwardDetails() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { list, pagination } = useSelector((state: RootState) => state.sizingYarnOutward);
  const { sizingJobWorkOrderList } = useSelector((state: RootState) => state.sizingJobWorkOrder as any);
  const { sizingPlanList } = useSelector((state: RootState) => state.sizingPlan as any);
  const { transportList } = useSelector((state: RootState) => (state as any).transport || { transportList: [] });
  const [viewRecord, setViewRecord] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const { currentPage, itemsPerPage, handlePageChange, getOffset,setItemsPerPage } = usePagination({ itemsPerPage: 10 });
  const selectedCompanyId = useMemo(() => resolveSelectedCompanyId(), []);

  // useEffect(() => {
  //   dispatch(getAllSizingYarnOutward({ offset: getOffset(), limit: itemsPerPage }));
  // }, [dispatch, getOffset, itemsPerPage, currentPage]);

    useEffect(() => {
    dispatch(getAllSizingYarnOutward({fetchAll: true} as any));
  }, [dispatch]);


  useEffect(() => {
    const companyId = selectedCompanyId;
    if (companyId) {
      dispatch(getAllSizingJobWorkOrdersByFactoryCompanyId({ factoryCompanyId: companyId }));
      // dispatch(getAllSizingPlan({ fetchAll: true, companyId } as any));
    } else {
      dispatch(getAllSizingJobWorkOrders({fetchAll: true} as any));
      // dispatch(getAllSizingPlan({ fetchAll: true } as any));
    }
    dispatch(getAllSizingPlan({ fetchAll: true } as any));
    dispatch(getAllTransports({ fetchAll: true }));
  }, [dispatch, selectedCompanyId]);

  const normalizedOrders = useMemo(() => extractArray(sizingJobWorkOrderList), [sizingJobWorkOrderList]);
  const normalizedPlans = useMemo(() => extractArray(sizingPlanList), [sizingPlanList]);

  const orderLookup = useMemo(() => {
    const map = new Map<string, OrderLookupValue>();
    normalizedOrders.forEach((order: any) => {
      const orderId = order?.id ?? order?.sizingJobWorkOrderId ?? order?.sizingOrderId;
      if (orderId == null) return;
      const orderNo =
        order?.sizingWorkOrderNo ??
        order?.sizingJobWorkOrderNo ??
        order?.jobWorkOrderNo ??
        order?.orderNo;
      const planId = order?.sizingPlanId ?? order?.planId ?? null;
      const planNo = order?.sizingPlanNo ?? order?.planNo ?? order?.planNumber ?? null;
      map.set(String(orderId), {
        orderNo: orderNo ? String(orderNo) : undefined,
        planId: planId != null ? String(planId) : undefined,
        planNo: planNo ? String(planNo) : undefined,
      });
    });
    return map;
  }, [normalizedOrders]);

  const planLookup = useMemo(() => {
    const map = new Map<string, string>();
    normalizedPlans.forEach((plan: any) => {
      const planId = plan?.id ?? plan?.sizingPlanId ?? plan?.planId;
      if (planId == null) return;
      const label =
        plan?.sizingPlanNo ??
        plan?.planNo ??
        plan?.planNumber ??
        plan?.planCode ??
        plan?.planName ??
        `Plan ${planId}`;
      map.set(String(planId), String(label));
    });
    return map;
  }, [normalizedPlans]);

  const normalizedSizingOrders = useMemo(() => extractArray(sizingJobWorkOrderList), [sizingJobWorkOrderList]);

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
        const buyerName =
          order?.buyerName ||
          order?.customerName ||
          order?.consigneeName ||
          order?.companyName ||
          order?.tradingCompanyName ||
          "";
        const parts = order?.parts ?? order?.totalParts ?? order?.numberOfParts ?? order?.partsCount ?? 0;
        const endsPerPart = order?.endsPerPart ?? order?.endsPerParts ?? order?.ends_per_part ?? 0;
        const yarnName = order?.yarnName || order?.yarnType || order?.yarnQuality || order?.yarn || "";
        return {
          value: String(resolvedId),
          label,
          meta: { sizingOrderId: resolvedId, orderNo: label, buyerName, parts, endsPerPart, yarnName },
        };
      })
      .filter(Boolean) as { value: string; label: string; meta: any }[];
  }, [normalizedSizingOrders]);

  const sizingOrderMeta = useMemo(() => {
    const map = new Map<string, any>();
    sizingOrderOptions.forEach((option) => map.set(option.value, option.meta));
    return map;
  }, [sizingOrderOptions]);
  
  const processedList = useMemo(() => {
    
    const safeList = Array.isArray(list) ? list : extractArray(list);
    const baseSerial = pagination?.offset || 0;
    return safeList.map((record: any, index: number) => {
      const issuedQty = computeIssuedQuantity(record);
      const sizingOrderId = record?.sizingOrderId ? String(record.sizingOrderId) : "";
      const orderMeta = sizingOrderMeta.get(sizingOrderId || "");
      
      const transportId = record?.transportId || record?.transportationId;
      const transport = transportList.find((t: any) => String(t.id) === String(transportId));
      const transportName = transport?.transportName || transport?.name || record?.transportName || "-";

      return {
        ...record,
        serialNo: baseSerial + index + 1,
        orderTypeLabel: resolveOrderTypeLabel(record),
        orderNoLabel: resolveOrderNo(record, orderLookup),
        planNoLabel: resolvePlanNo(record, orderLookup, planLookup),
        buyerName: record?.buyerName || orderMeta?.buyerName || "-",
        yarnLabel: collectYarnLabels(record),
        transportName,
        issuedQty,
      };
    });
  }, [list, pagination?.offset, orderLookup, planLookup, transportList, sizingOrderMeta]);

  const columns = useMemo(
    () => [
      { Header: "S.No", accessor: "serialNo", width: 60, disableFilters: true },
      {
        Header: "Outward Date",
        accessor: (row: any) => row?.outwardDate || row?.createdAt || row?.documentDate || "",
       Cell: ({ value }: { value: string }) => {
                       if (!value) return 'N/A';
                       const date = new Date(value);
                       const day = date.getDate().toString().padStart(2, '0');
                       const month = (date.getMonth() + 1).toString().padStart(2, '0');
                       const year = date.getFullYear();
                       return `${day}/${month}/${year}`;
                     },
                     Filter: DateRangeFilter, },
      { Header: "Outward No", accessor: (row: any) => row?.outwardNo || row?.documentNo || "-" },
      { Header: "Order Type", accessor: "orderTypeLabel" },
      { Header: "Sizing Order No", accessor: "orderNoLabel" },
      { Header: "Sizing Plan No", accessor: "planNoLabel" },
      { Header: "Buyer Name", accessor: "buyerName" },
      { Header: "Transport", accessor: "transportName" },
      { Header: "Yarn Name", accessor: "yarnLabel" },
      {
        Header: "Quantity",
        accessor: "issuedQty",
        Cell: ({ value }: { value: number }) => (Number.isFinite(value) ? value.toFixed(3) : "0.000"),
      },
    ],
    [],
  );

  const handleAdd = () => {
    navigate("/transaction/sizing-yarn-outward");
  };

  const handleEdit = (record: any) => {
    navigate("/transaction/sizing-yarn-outward", { state: { sizingYarnOutwardDtl: record } });
  };

  const handleView = (record: any) => {
    setViewRecord(record);
    setIsViewModalOpen(true);
  };

  const handlePrint = (record: any) => {
    const printData = {
      ...record,
      type: 'sizing-outward'
    };
    localStorage.setItem('yarnReturnPrintData', JSON.stringify(printData));
    const url = `/#/transaction/yarn-delivery-challan-print?id=${record.id}&type=sizing-outward`;
    window.open(url, '_blank');
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewRecord(null);
  };

  const viewItems = useMemo(() => {
    if (!viewRecord) return [] as any[];
    const details = extractArray(viewRecord?.yarnIssueDetails || viewRecord?.items || viewRecord?.details);
    return details.map((detail, index) => {
      const issuedQuantity = Number(detail?.issuedQuantity ?? detail?.issueQty ?? detail?.issuedQty ?? 0);
      const issuingBags = Number(detail?.issuingBags ?? detail?.issuedBags ?? detail?.issueBags ?? 0);
      return {
        serialNo: index + 1,
        inwardNo: detail?.sizingYarnInwardNo || detail?.inwardNo || "-",
        yarnName: detail?.yarnName || detail?.actualYarn || "-",
        inwardBags: detail?.inwardBags ?? detail?.availableBags ?? detail?.noOfBags ?? "-",
        inwardQty: detail?.inwardQuantity ?? detail?.availableQty ?? detail?.quantity ?? "-",
        kgsPerBag: detail?.kgsPerBag ?? detail?.kgs_per_bag ?? "-",
        coneWeight: detail?.coneWeight ?? detail?.conesWeight ?? "-",
        issuingBags: Number.isFinite(issuingBags) ? issuingBags : "-",
        issuedQuantity: Number.isFinite(issuedQuantity) ? issuedQuantity : "-",
        millName: detail?.millName || "-",
        lotNo: detail?.lotNo || "-",
      };
    });
  }, [viewRecord]);

  const summaryTotals = useMemo(() => {
    if (!viewRecord) return { issuedBags: 0, issuedQty: 0 };
    const details = viewItems;
    if (!details.length) {
      return {
        issuedBags: Number(viewRecord?.summary?.issuedBags ?? viewRecord?.issuedBags ?? 0) || 0,
        issuedQty: Number(viewRecord?.summary?.issuedQuantity ?? viewRecord?.issuedQuantity ?? 0) || 0,
      };
    }
    return details.reduce(
      (acc, detail) => {
        const bags = Number(detail.issuingBags ?? 0);
        const qty = Number(detail.issuedQuantity ?? 0);
        return {
          issuedBags: acc.issuedBags + (Number.isFinite(bags) ? bags : 0),
          issuedQty: acc.issuedQty + (Number.isFinite(qty) ? qty : 0),
        };
      },
      { issuedBags: 0, issuedQty: 0 },
    );
  }, [viewItems, viewRecord]);

  return (
    <div className="p-6 pt-16 space-y-6">
      <DataTable
        columns={columns}
        data={processedList}
        title="Sizing Yarn Outward"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onPrint={handlePrint}
        showActions
        showColumnFilters
        filterPlaceholder="Search sizing yarn outward..."
        disableFullDataFetch = {true}
        //  initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        // totalCount={pagination?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
      />
{/* 
      <Pagination
        currentPage={currentPage}
        totalItems={pagination?.total || processedList.length}
        itemsPerPage={itemsPerPage}
        offset={pagination?.offset || 0}
        hasNext={!!pagination?.next}
        hasPrev={!!pagination?.prev}
        onPageChange={handlePageChange}
      /> */}

      <Modal
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        title="Sizing Yarn Outward Details"
        className="w-full max-w-4xl"
      >
        {viewRecord && (
          <div className="space-y-6 text-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-gray-500">Outward Date</p>
                <p className="font-semibold">{viewRecord?.outwardDate ? formatDate(viewRecord.outwardDate) : "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Outward No</p>
                <p className="font-semibold">{viewRecord?.outwardNo || viewRecord?.documentNo || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Order Type</p>
                <p className="font-semibold">{resolveOrderTypeLabel(viewRecord)}</p>
              </div>
              <div>
                <p className="text-gray-500">Sizing Order No</p>
                <p className="font-semibold">{resolveOrderNo(viewRecord)}</p>
              </div>
              <div>
                <p className="text-gray-500">Sizing Plan No</p>
                <p className="font-semibold">{resolvePlanNo(viewRecord)}</p>
              </div>
              <div>
                <p className="text-gray-500">Buyer Name</p>
                <p className="font-semibold">{resolveBuyerName(viewRecord)}</p>
              </div>
              <div>
                <p className="text-gray-500">Yarn Name</p>
                <p className="font-semibold">{collectYarnLabels(viewRecord)}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Quantity</p>
                <p className="font-semibold">{computeIssuedQuantity(viewRecord).toFixed(3)}</p>
              </div>
              <div>
                <p className="text-gray-500">Vehicle No</p>
                <p className="font-semibold">{viewRecord?.vehicleNo || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Transport</p>
                <p className="font-semibold">
                  {(() => {
                    const transportId = viewRecord?.transportId || viewRecord?.transportationId;
                    const transport = transportList.find((t: any) => String(t.id) === String(transportId));
                    return transport?.transportName || transport?.name || viewRecord?.transportName || "-";
                  })()}
                </p>
              </div>
              <div className="md:col-span-3">
                <p className="text-gray-500">Remarks</p>
                <p className="font-semibold">{viewRecord?.remarks || viewRecord?.remark || "-"}</p>
              </div>
            </div>

            <div className="overflow-auto">
              <table className="min-w-full border text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 py-1">S.No</th>
                    <th className="border px-2 py-1">Sizing Yarn Inward No</th>
                    <th className="border px-2 py-1">Yarn Name</th>
                    <th className="border px-2 py-1">Inward Bags</th>
                    <th className="border px-2 py-1">Inward Qty</th>
                    <th className="border px-2 py-1">Kgs/Bag</th>
                    <th className="border px-2 py-1">Cone Wt</th>
                    <th className="border px-2 py-1">Issuing Bags</th>
                    <th className="border px-2 py-1">Issued Qty</th>
                    <th className="border px-2 py-1">Mill Name</th>
                    <th className="border px-2 py-1">Lot No</th>
                  </tr>
                </thead>
                <tbody>
                  {viewItems.length ? (
                    viewItems.map((item) => (
                      <tr key={item.serialNo} className="odd:bg-white even:bg-gray-50">
                        <td className="border px-2 py-1 text-center">{item.serialNo}</td>
                        <td className="border px-2 py-1">{item.inwardNo}</td>
                        <td className="border px-2 py-1">{item.yarnName}</td>
                        <td className="border px-2 py-1">{item.inwardBags}</td>
                        <td className="border px-2 py-1">{item.inwardQty}</td>
                        <td className="border px-2 py-1">{item.kgsPerBag}</td>
                        <td className="border px-2 py-1">{item.coneWeight}</td>
                        <td className="border px-2 py-1">{item.issuingBags}</td>
                        <td className="border px-2 py-1">{item.issuedQuantity}</td>
                        <td className="border px-2 py-1">{item.millName}</td>
                        <td className="border px-2 py-1">{item.lotNo}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="border px-4 py-6 text-center text-gray-500">
                        No yarn issue details available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Issued Bags</p>
                <p className="text-lg font-semibold">{summaryTotals.issuedBags.toFixed(3)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Issued Quantity</p>
                <p className="text-lg font-semibold">{summaryTotals.issuedQty.toFixed(3)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
