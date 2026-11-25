//beam outward details

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Edit } from "lucide-react";
import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { formatDate } from "@/lib/utils";
import { getAllBeamOutward } from "@/state/beamOutwardSlice";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllSizingPlan } from "@/state/sizingPlanSlice";
import { getAllBeamInward } from "@/state/beamInwardSlice";
import { AppDispatch, RootState } from "@/state/store";
import { Pagination, usePagination } from "@/components/common/Pagination";

const toArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
};

export default function BeamOutwardDetails() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { beamOutwardList, paginationInfo } = useSelector((state: RootState) => state.beamOutward as any);
  const { vendorList } = useSelector((state: RootState) => state.vendor as any);
  const { sizingPlanList } = useSelector((state: RootState) => state.sizingPlan as any);
  const { beamInwardList } = useSelector((state: RootState) => state.beamInward as any);

  const [companyId, setCompanyId] = useState<number | null>(null);
  const [companyResolved, setCompanyResolved] = useState(false);

  const outwardData = useMemo(() => toArray(beamOutwardList), [beamOutwardList]);
  const vendors = useMemo(() => toArray(vendorList), [vendorList]);
  const plans = useMemo(() => toArray(sizingPlanList), [sizingPlanList]);
  const beamInwards = useMemo(() => toArray(beamInwardList), [beamInwardList]);
  const { currentPage, itemsPerPage, handlePageChange, getOffset, setItemsPerPage } = usePagination({ itemsPerPage: 10 });

  useEffect(() => {
    let id: number | null = null;
    try {
      const stored = localStorage.getItem("selectedCompanyId");
      if (stored) id = Number(stored);

      if (id == null) {
        const fallback = localStorage.getItem("selectedCompany");
        if (fallback) {
          const parsed = JSON.parse(fallback);
          if (parsed?.id != null) id = Number(parsed.id);
        }
      }

      if (id == null) {
        const legacy = localStorage.getItem("companyId");
        if (legacy) id = Number(legacy);
      }

      if (id == null) {
        const authPayloadRaw = localStorage.getItem("authPayload");
        if (authPayloadRaw) {
          const authPayload = JSON.parse(authPayloadRaw);
          const companies = authPayload?.user?.companies || authPayload?.companies || [];
          if (Array.isArray(companies) && companies.length && companies[0]?.id != null) {
            id = Number(companies[0].id);
          }
        }
      }
    } catch {
      id = null;
    }

    setCompanyId(id);
    setCompanyResolved(true);
  }, []);

  useEffect(() => {
    dispatch(getAllVendors({fetchAll: true} as any));
    dispatch(getAllSizingPlan({ fetchAll: true } as any));
  }, [dispatch]);

  useEffect(() => {
    if (!companyResolved) return;
    const beamInwardPayload: any = { fetchAll: true };
    if (companyId != null) beamInwardPayload.companyId = companyId;
    dispatch(getAllBeamInward(beamInwardPayload));
  }, [dispatch, companyId, companyResolved]);

  useEffect(() => {
    if (!companyResolved) return;
    const outwardPayload: any = { fetchAll: true };
    if (companyId != null) outwardPayload.companyId = companyId;
    dispatch(getAllBeamOutward(outwardPayload));
  }, [dispatch, companyId, companyResolved, currentPage, itemsPerPage, getOffset]);

  const vendorMap = useMemo(() => {
    const map = new Map<string, string>();
    vendors.forEach((vendor: any) => {
      if (vendor?.id != null) {
        map.set(String(vendor.id), vendor?.vendorName || vendor?.name || vendor?.companyName || "");
      }
    });
    return map;
  }, [vendors]);

  const planMap = useMemo(() => {
    const map = new Map<string, string>();
    plans.forEach((plan: any) => {
      if (plan?.id != null) {
        map.set(
          String(plan.id),
          plan?.sizingPlanNo || plan?.planNo || plan?.sizingPlanNumber || String(plan.id)
        );
      }
    });
    return map;
  }, [plans]);

  const beamInwardMap = useMemo(() => {
    const map = new Map<string, string>();
    beamInwards.forEach((beam: any) => {
      if (beam?.id != null) {
        map.set(String(beam.id), beam?.beamInwardNo || beam?.documentNo || String(beam.id));
      }
    });
    return map;
  }, [beamInwards]);

  const processedRows = useMemo(
    () =>
      outwardData.map((row: any, index: number) => ({
        ...row,
        serialNo: (paginationInfo?.offset ?? 0) + index + 1,
      })),
    [outwardData, paginationInfo?.offset]
  );

  const handleView = useCallback(
    (row: any) => {
      if (!row) return;
      const record = row?.original ?? row;
      const identifier = record?.id ?? record?.beamOutwardId ?? record?.outwardNo ?? record?.beamOutwardNo;
      const search = identifier ? `?id=${encodeURIComponent(identifier)}` : "";
      navigate(`/transaction/beam-outward-view${search}`, { state: { beamOutwardView: record } });
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (row: any) => {
      if (!row) return;
      const record = row?.original ?? row;
      navigate("/transaction/beam-outward", { state: { beamOutwardEdit: record } });
    },
    [navigate]
  );

  const handlePrint = useCallback((row: any) => {
    const record = row?.original ?? row;
    const identifier = record?.id ?? record?.beamOutwardId;
    if (identifier) {
      // Store data for the new tab to pick up
      const printData = {
        ...record,
        type: 'beam-outward'
      };
      localStorage.setItem('yarnReturnPrintData', JSON.stringify(printData));
      
      // Open in new tab with hash routing
      window.open(`/#/transaction/yarn-delivery-challan-print?id=${identifier}`, '_blank', 'noopener');
    }
  }, []);

  
  const columns = useMemo(
    () => [
      { Header: "S.No", accessor: "serialNo", width: 50, disableFilters: true },
      {
        Header: "Outward Date",
        accessor: (row: any) => row?.outwardDate || row?.createdAt || row?.date || "",
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
      {
        Header: "Outward No",
        accessor: (row: any) => row?.outwardNo || row?.documentNo || row?.beamOutwardNo || "-",
      },
      {
        Header: "Sizing Vendor",
        accessor: (row: any) => {
          const id = row?.sizingVendorId ?? row?.vendorId ?? row?.beamInward?.sizingVendorId;
          return vendorMap.get(String(id)) || "-";
        },
      },
      {
        Header: "Weaver Name",
        accessor: (row: any) => {
          const vendorIds = new Set<string>();
          
          // Check top-level ID
          const topId = row?.weavingVendorId ?? row?.vendorId;
          if (topId) vendorIds.add(String(topId));
          
          // Check nested details for multiple weavers
          if (Array.isArray(row.outwardDetails)) {
            row.outwardDetails.forEach((detail: any) => {
              const dId = detail.weavingVendorId || detail.weaverId || detail.vendorId;
              if (dId) vendorIds.add(String(dId));
            });
          }
          
          if (vendorIds.size === 0) return "-";
          
          const names = Array.from(vendorIds)
            .map(id => vendorMap.get(id))
            .filter(Boolean);
            
          return names.length > 0 ? names.join(", ") : "-";
        },
      },
      {
        Header: "Sizing Plan No",
        accessor: (row: any) => planMap.get(String(row?.sizingPlanId)) || "-",
      },
      {
        Header: "Beam Meter",
        accessor: (row: any) => row.totalBeamMeters ?? row?.wrapMeters ?? row?.beamMeters ?? 0,
      },
      {
        Header: "Beam Inward No",
        accessor: (row: any) => row?.beamInwardNo || beamInwardMap.get(String(row?.beamInwardId)) || "-",
      },
      {
        Header: "Action",
        accessor: "id",
        Cell: ({ row }: any) => {
          const record = row?.original ?? row;
          return (
            <div className="flex items-center gap-3">
              {/* <button type="button" onClick={() => handleView(record)} className="text-indigo-600 underline text-sm">
                View
              </button> */}
              <button type="button" onClick={() => handleEdit(record)} className="text-blue-600" title="Edit">
                <Edit size={16} />
              </button>
              <button type="button" onClick={() => handlePrint(record)} className="text-primary underline text-sm">
                Print
              </button>
            </div>
          );
        },
        disableFilters: true,
      },
    ],
    [vendorMap, planMap, beamInwardMap, handleView, handleEdit, handlePrint]
  );

  return (
    <div className="p-6 pt-16">
      <DataTable
        columns={columns}
        data={processedRows}
        title="Beam Outward"
        onAdd={() => navigate("/transaction/beam-outward")}
        // onView={handleView}
        showActions={false}
        filterPlaceholder="Search beam outward..."
        showColumnFilters={true}
        disableFullDataFetch={true}
        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        // totalCount={paginationInfo?.total}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
      />
      {/* <Pagination
        currentPage={currentPage}
        totalItems={paginationInfo?.total ?? 0}
        itemsPerPage={itemsPerPage}
        offset={paginationInfo?.offset ?? 0}
        hasNext={!!paginationInfo?.next}
        hasPrev={!!paginationInfo?.prev}
        onPageChange={handlePageChange}
      /> */}
    </div>
  );
}

