import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { formatDate } from "@/lib/utils";
import { AppDispatch, RootState } from "@/state/store";
import { getAllWeavingYarnOutward } from "@/state/weavingYarnOutwardSlice";
import { getAllWeavingJobWorkOrders, getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";

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
  contractId?: string;
  contractNo?: string;
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
    record?.weavingJobWorkOrderNo,
    record?.weavingWorkOrderNo,
    record?.weavingJobWorkOrder?.weavingJobWorkOrderNo,
    record?.weavingJobWorkOrder?.weavingWorkOrderNo,
    record?.weavingJobWorkOrder?.jobWorkOrderNo,
    record?.jobWorkOrderNo,
    record?.orderNo,
    record?.sizingOrderNo,
    record?.sizingJobWorkOrderNo,
    record?.sizingJobWorkOrder?.sizingWorkOrderNo,
    record?.sizingJobWorkOrder?.sizingJobWorkOrderNo,
    record?.sizingOrder?.sizingOrderNo,
    record?.sizingOrder?.orderNo,
    record?.orderDetails?.sizingOrderNo,
  ];
  const match = candidates.find((value) => value != null && String(value).trim() !== "");
  if (match) return String(match);
  const identifier =
    record?.weavingJobWorkOrderId ??
    record?.weavingJobWorkOrder?.id ??
    record?.jobWorkOrderId ??
    record?.orderId ??
    record?.sizingJobWorkOrderId ??
    record?.sizingJobWorkOrder?.id ??
    record?.sizingOrderId ??
    record?.sizingOrder?.id;
  if (identifier != null && orderLookup?.size) {
    const lookup = orderLookup.get(String(identifier));
    if (lookup?.orderNo) return lookup.orderNo;
  }
  return identifier != null ? String(identifier) : "-";
};

const resolveContractNo = (
  record: any,
  orderLookup?: Map<string, OrderLookupValue>,
  contractLookup?: Map<string, string>,
) => {
  const candidates = [
    record?.weavingContractNo,
    record?.contractNo,
    record?.weavingContract?.weavingContractNo,
    record?.weavingContract?.contractNo,
    record?.contract?.contractNo,
  ];
  const match = candidates.find((value) => value != null && String(value).trim() !== "");
  if (match) return String(match);

  const identifier =
    record?.weavingContractId ??
    record?.contractId ??
    record?.weavingContract?.id ??
    record?.contract?.id;

  const orderIdentifier =
    record?.weavingJobWorkOrderId ??
    record?.jobWorkOrderId ??
    record?.orderId ??
    record?.weavingJobWorkOrder?.id;

  const orderMeta = orderIdentifier != null ? orderLookup?.get(String(orderIdentifier)) : undefined;
  const candidateContractIds = [identifier, orderMeta?.contractId].filter((value) => value != null);

  for (const contractId of candidateContractIds) {
    const key = String(contractId);
    if (contractLookup?.has(key)) {
      return contractLookup.get(key) as string;
    }
    if (orderMeta?.contractNo && orderMeta.contractId === key) {
      return orderMeta.contractNo;
    }
  }

  if (orderMeta?.contractNo) return orderMeta.contractNo;
  if (candidateContractIds.length) return String(candidateContractIds[0]);
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

export default function WeavingYarnOutwardDetails() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { list, pagination } = useSelector((state: RootState) => state.weavingYarnOutward);
  const { weavingJobWorkOrderList } = useSelector((state: RootState) => state.weavingJobWorkOrder as any);
  const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts as any);
  const [viewRecord, setViewRecord] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const { currentPage, itemsPerPage, handlePageChange, getOffset,setItemsPerPage } = usePagination({ itemsPerPage: 10 });
  const selectedCompanyId = useMemo(() => resolveSelectedCompanyId(), []);

  // useEffect(() => {
  //   dispatch(getAllWeavingYarnOutward({ offset: getOffset(), limit: itemsPerPage }));
  // }, [dispatch, getOffset, itemsPerPage, currentPage]);

    useEffect(() => {
    dispatch(getAllWeavingYarnOutward({ fetchAll: true } as any));
  }, [dispatch]);

  useEffect(() => {
    dispatch(getAllWeavingJobWorkOrders({ fetchAll: true } as any));
    dispatch(getAllWeavingContract({ fetchAll: true } as any));
  }, [dispatch]);

  const normalizedOrders = useMemo(() => extractArray(weavingJobWorkOrderList), [weavingJobWorkOrderList]);
  const normalizedContracts = useMemo(() => extractArray(weavingContractList), [weavingContractList]);

  const orderLookup = useMemo(() => {
    const map = new Map<string, OrderLookupValue>();
    normalizedOrders.forEach((order: any) => {
      const orderId = order?.id ?? order?.weavingJobWorkOrderId ?? order?.jobWorkOrderId;
      if (orderId == null) return;
      const orderNo =
        order?.weavingWorkOrderNo ??
        order?.jobWorkOrderNo ??
        order?.orderNo;
      const contractId = order?.weavingContractId ?? order?.contractId ?? order?.weavingContract?.id ?? null;
      const contractNo =
        order?.weavingContract?.weavingContractNo ??
        order?.weavingContract?.contractNo ??
        order?.weavingContractNo ??
        order?.contractNo ??
        null;
      map.set(String(orderId), {
        orderNo: orderNo ? String(orderNo) : undefined,
        contractId: contractId != null ? String(contractId) : undefined,
        contractNo: contractNo ? String(contractNo) : undefined,
      });
    });
    return map;
  }, [normalizedOrders]);

  const contractLookup = useMemo(() => {
    const map = new Map<string, string>();
    normalizedContracts.forEach((contract: any) => {
      const contractId = contract?.id ?? contract?.weavingContractId ?? contract?.contractId;
      if (contractId == null) return;
      const label =
        contract?.weavingContractNo ??
        contract?.contractNo ??
        contract?.contractNumber ??
        contract?.contractCode ??
        `Contract ${contractId}`;
      map.set(String(contractId), String(label));
    });
    return map;
  }, [normalizedContracts]);

  const processedList = useMemo(() => {
    const safeList = Array.isArray(list) ? list : extractArray(list);
    const baseSerial = pagination?.offset || 0;
    return safeList.map((record: any, index: number) => {
      const issuedQty = computeIssuedQuantity(record);
      return {
        ...record,
        serialNo: baseSerial + index + 1,
        orderTypeLabel: resolveOrderTypeLabel(record),
        orderNoLabel: resolveOrderNo(record, orderLookup),
        contractNoLabel: resolveContractNo(record, orderLookup, contractLookup),
        buyerLabel: resolveBuyerName(record),
        yarnLabel: collectYarnLabels(record),
        issuedQty,
      };
    });
  }, [list, pagination?.offset, orderLookup, contractLookup]);

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
                    Filter: DateRangeFilter,
      },
      { Header: "Outward No", accessor: (row: any) => row?.outwardNo || row?.documentNo || "-" },
      { Header: "Order Type", accessor: "orderTypeLabel" },
      { Header: "Weaving Jobwork Order No", accessor: "orderNoLabel" },
      { Header: "Weaving Contract No", accessor: "contractNoLabel" },
      { Header: "Buyer Name", accessor: "buyerName" },
      { Header: "Yarn Name", accessor: "yarnLabel" },
      {
        Header: "Quantity",
        accessor: "issuedQty",
        Cell: ({ value }: { value: number }) => (Number.isFinite(value) ? value.toFixed(3) : "0.000"),
      },
      {
        Header: "Print",
        accessor: "print",
        disableFilters: true,
        Cell: ({ row }: { row: { original: any } }) => (
          <a
            href={`/#/transaction/yarn-delivery-challan-print?id=${row.original.id}&type=weaving-outward`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            Print
          </a>
        ),
      },
    ],
    [],
  );

  const handleAdd = () => {
    navigate("/transaction/weaving-yarn-outward");
  };

  const handleEdit = (record: any) => {
    navigate("/transaction/weaving-yarn-outward", { state: { weavingYarnOutwardDtl: record } });
  };

  const handleView = (record: any) => {
    setViewRecord(record);
    setIsViewModalOpen(true);
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
        title="Weaving Yarn Outward"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        showActions
        showColumnFilters
        filterPlaceholder="Search weaving yarn outward..."
        disableFullDataFetch ={true}
        // initialPageSize={itemsPerPage}
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
        title="Weaving Yarn Outward Details"
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
                <p className="text-gray-500">Weaving Jobwork Order No</p>
                <p className="font-semibold">{resolveOrderNo(viewRecord)}</p>
              </div>
              <div>
                <p className="text-gray-500">Weaving Contract No</p>
                <p className="font-semibold">{resolveContractNo(viewRecord)}</p>
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
