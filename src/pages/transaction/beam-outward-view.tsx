import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { AppDispatch, RootState } from "@/state/store";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllSizingPlan } from "@/state/sizingPlanSlice";
import { getAllBeamInward } from "@/state/beamInwardSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllBeamOutward, getBeamOutwardByBeamInwardId } from "@/state/beamOutwardSlice";

interface BeamLineItem {
  key: string;
  sizedBeamNo: string;
  weaverName: string;
  weavingContractNo: string;
  salesOrderNo: string;
  flangeNo: string;
  beamMeters: number;
  width: number;
  expectedFabricMeter: number;
}

const toArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
};

const calculateExpected = (beamMeters: number, width: number, shrinkage: number) => {
  const base = Number(beamMeters || 0) * Number(width || 0);
  const shrink = Number(shrinkage || 0) / 100;
  const result = base - base * shrink;
  if (!isFinite(result)) return 0;
  return Number(result.toFixed(2));
};

export default function BeamOutwardView() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const viewRecord = (location.state as any)?.beamOutwardView;
  const beamOutwardState = useSelector((state: RootState) => state.beamOutward as any);
  const vendorList = useSelector((state: RootState) => state.vendor as any);
  const sizingPlanList = useSelector((state: RootState) => state.sizingPlan as any);
  const beamInwardState = useSelector((state: RootState) => state.beamInward as any);
  const weavingContractList = useSelector((state: RootState) => state.weavingContracts as any);
  const salesOrderList = useSelector((state: RootState) => state.salesOrder as any);
  const vendorOptions = useMemo(() => toArray(vendorList.vendorList), [vendorList.vendorList]);
  const planOptions = useMemo(() => toArray(sizingPlanList.sizingPlanList), [sizingPlanList.sizingPlanList]);
  const beamInwardOptions = useMemo(() => toArray(beamInwardState.beamInwardList), [beamInwardState.beamInwardList]);
  const weavingContracts = useMemo(() => toArray(weavingContractList.weavingContractList), [weavingContractList.weavingContractList]);
  const salesOrders = useMemo(() => toArray(salesOrderList.salesOrderList), [salesOrderList.salesOrderList]);
  const outwardList = useMemo(() => toArray(beamOutwardState?.beamOutwardList), [beamOutwardState?.beamOutwardList]);
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const requestedId = searchParams.get("id");
  const resolvedRecord = useMemo(() => {
    if (viewRecord) return viewRecord;
    if (requestedId) {
      return (
        outwardList.find((row: any) => {
          if (!row) return false;
          const matchesId = row?.id != null && String(row.id) === requestedId;
          const matchesOutward = row?.outwardNo && String(row.outwardNo) === requestedId;
          const matchesBeam = row?.beamOutwardNo && String(row.beamOutwardNo) === requestedId;
          return matchesId || matchesOutward || matchesBeam;
        }) || null
      );
    }
    return null;
  }, [viewRecord, outwardList, requestedId]);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [records, setRecords] = useState<any[]>(viewRecord ? [viewRecord] : []);
  const [isLoadingLines, setIsLoadingLines] = useState(false);
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
    } catch {
      id = null;
    }
    setCompanyId(id);
  }, []);
  useEffect(() => {
    dispatch(getAllVendors({} as any));
    dispatch(getAllSizingPlan({ fetchAll: true } as any));
    dispatch(getAllWeavingContract({ fetchAll: true } as any));
    dispatch(getAllSalesOrders({ fetchAll: true } as any));
  }, [dispatch]);
  useEffect(() => {
    const payload: any = { fetchAll: true };
    if (companyId != null) payload.companyId = companyId;
    dispatch(getAllBeamInward(payload));
  }, [dispatch, companyId]);
  useEffect(() => {
    if (viewRecord) return;
    if (!requestedId) return;
    if (resolvedRecord) return;
    const payload = companyId != null ? { companyId } : undefined;
    dispatch(getAllBeamOutward(payload));
  }, [dispatch, viewRecord, requestedId, resolvedRecord, companyId]);
  useEffect(() => {
    if (!resolvedRecord) {
      setRecords([]);
      return;
    }
    if (Array.isArray(resolvedRecord?.outwardDetails) && resolvedRecord.outwardDetails.length) {
      setRecords([resolvedRecord]);
      setIsLoadingLines(false);
      return;
    }
    if (!resolvedRecord.beamInwardId) {
      setRecords([resolvedRecord]);
      setIsLoadingLines(false);
      return;
    }
    setIsLoadingLines(true);
    const payload: any = { beamInwardId: Number(resolvedRecord.beamInwardId) };
    if (companyId != null) payload.companyId = companyId;
    dispatch(getBeamOutwardByBeamInwardId(payload))
      .unwrap()
      .then((response: any) => {
        const rows = toArray(response);
        const filtered = rows.filter((row: any) => {
          if (resolvedRecord?.outwardNo) {
            return (
              String(row?.outwardNo) === String(resolvedRecord.outwardNo) ||
              String(row?.beamOutwardNo) === String(resolvedRecord.outwardNo)
            );
          }
          if (resolvedRecord?.id != null) {
            return String(row?.id) === String(resolvedRecord.id);
          }
          return false;
        });
        if (filtered.length) {
          setRecords(filtered);
        } else {
          setRecords([resolvedRecord]);
        }
      })
      .catch(() => setRecords([resolvedRecord]))
      .finally(() => setIsLoadingLines(false));
  }, [dispatch, companyId, resolvedRecord]);
  const vendorMap = useMemo(() => {
    const map = new Map<string, string>();
    vendorOptions.forEach((vendor: any) => {
      if (vendor?.id != null) {
        map.set(String(vendor.id), vendor.vendorName || vendor.name || vendor.companyName || "");
      }
    });
    return map;
  }, [vendorOptions]);
  const planMap = useMemo(() => {
    const map = new Map<string, string>();
    planOptions.forEach((plan: any) => {
      if (plan?.id != null) {
        map.set(
          String(plan.id),
          plan?.sizingPlanNo || plan?.planNo || plan?.sizingPlanNumber || String(plan.id)
        );
      }
    });
    return map;
  }, [planOptions]);
  const beamInwardMap = useMemo(() => {
    const map = new Map<string, string>();
    beamInwardOptions.forEach((beam: any) => {
      if (beam?.id != null) {
        map.set(String(beam.id), beam?.beamInwardNo || beam?.documentNo || String(beam.id));
      }
    });
    return map;
  }, [beamInwardOptions]);
  const weavingContractMap = useMemo(() => {
    const map = new Map<string, string>();
    weavingContracts.forEach((contract: any) => {
      if (contract?.id != null) {
        map.set(
          String(contract.id),
          contract?.weavingContractNo ||
            contract?.contractNo ||
            contract?.wcNo ||
            contract?.weavingContractNumber ||
            String(contract.id)
        );
      }
    });
    return map;
  }, [weavingContracts]);
  const salesOrderMap = useMemo(() => {
    const map = new Map<string, string>();
    salesOrders.forEach((order: any) => {
      if (order?.id != null) {
        map.set(
          String(order.id),
          order?.salesOrderNo || order?.salesOrderNumber || order?.orderNo || String(order.id)
        );
      }
    });
    return map;
  }, [salesOrders]);
  const mapSavedOutwardDetails = useCallback(
    (entries: any[]): BeamLineItem[] => {
      if (!Array.isArray(entries) || !entries.length) return [];
      return entries.flatMap((record: any, recordIdx: number) => {
        const details = Array.isArray(record?.outwardDetails) && record.outwardDetails.length
          ? record.outwardDetails
          : [record];
        return details.map((detail: any, detailIdx: number) => {
          const weaverId = detail?.weavingVendorId ?? record?.weavingVendorId ?? record?.vendorId;
          const contractId = detail?.weavingContractId ?? record?.weavingContractId;
          const salesOrderId = detail?.salesOrderId ?? record?.salesOrderId;
          const beamMeters = Number(
            detail?.wrapMeters ?? detail?.beamMeters ?? record?.wrapMeters ?? record?.beamMeters ?? 0
          );
          const width = Number(
            detail?.fabricPanelWidth ?? detail?.width ?? record?.fabricPanelWidth ?? record?.width ?? 0
          );
          const shrinkage = Number(detail?.shrinkage ?? record?.shrinkage ?? 0);
          return {
            key: `${recordIdx}-${detailIdx}-${detail?.id ?? detailIdx}`,
            sizedBeamNo: detail?.sizedBeamNo ?? record?.sizedBeamNo ?? "",
            weaverName: vendorMap.get(String(weaverId)) || detail?.weaverName || "",
            weavingContractNo:
              weavingContractMap.get(String(contractId)) || detail?.weavingContractNo || "",
            salesOrderNo: salesOrderMap.get(String(salesOrderId)) || detail?.salesOrderNo || "",
            flangeNo: detail?.flangeNo ?? record?.flangeNo ?? "",
            beamMeters,
            width,
            expectedFabricMeter: Number(
              detail?.expectedFabricMeter ?? calculateExpected(beamMeters, width, shrinkage)
            ),
          } as BeamLineItem;
        });
      });
    },
    [vendorMap, weavingContractMap, salesOrderMap]
  );
  const lineItems = useMemo(() => mapSavedOutwardDetails(records), [records, mapSavedOutwardDetails]);
  const summary = useMemo(() => {
    const totalMeters = lineItems.reduce((sum, item) => sum + Number(item.beamMeters || 0), 0);
    const totalExpected = lineItems.reduce((sum, item) => sum + Number(item.expectedFabricMeter || 0), 0);
    return {
      beams: lineItems.length,
      meters: Number(totalMeters.toFixed(3)),
      expected: Number(totalExpected.toFixed(3)),
    };
  }, [lineItems]);
  const activeRecord = records[0] ?? resolvedRecord ?? null;
  const outwardNo = activeRecord?.outwardNo || activeRecord?.beamOutwardNo || activeRecord?.documentNo || "-";
  const outwardDate = activeRecord?.outwardDate || activeRecord?.createdAt || activeRecord?.date || "";
  const sizingVendorId = activeRecord?.sizingVendorId ?? activeRecord?.vendorId ?? activeRecord?.beamInward?.sizingVendorId;
  const sizingVendorName = sizingVendorId != null ? vendorMap.get(String(sizingVendorId)) || "-" : "-";
  const planLabel = activeRecord?.sizingPlanId != null
    ? planMap.get(String(activeRecord.sizingPlanId)) || "-"
    : planMap.get(String(activeRecord?.beamInward?.sizingPlanId)) || "-";
  const beamInwardLabel = activeRecord?.beamInwardNo
    || beamInwardMap.get(String(activeRecord?.beamInwardId))
    || beamInwardMap.get(String(activeRecord?.beamInward?.id))
    || "-";
  if (!activeRecord) {
    return (
      <div className="p-6 pt-16 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/transaction/beam-outward-details")}>Back</Button>
          <h2 className="text-2xl font-semibold">Beam Outward View</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Beam Outward Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Select a beam outward entry from the list to view its full details.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="p-6 pt-16 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => navigate("/transaction/beam-outward-details")}>Back</Button>
        <h2 className="text-2xl font-semibold">Beam Outward View</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Outward No</p>
              <p className="text-lg font-semibold">{outwardNo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Outward Date</p>
              <p className="text-lg font-semibold">{outwardDate ? formatDate(outwardDate) : "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Sizing Vendor</p>
              <p className="text-lg font-semibold">{sizingVendorName || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Sizing Plan</p>
              <p className="text-lg font-semibold">{planLabel || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Beam Inward</p>
              <p className="text-lg font-semibold">{beamInwardLabel}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Beams</p>
              <p className="text-lg font-semibold">{summary.beams}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Beam Meters</p>
              <p className="text-lg font-semibold">{summary.meters.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Expected Fabric Meter</p>
              <p className="text-lg font-semibold">{summary.expected.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Beam Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingLines ? (
            <div className="py-10 text-center text-gray-500">Loading beam details...</div>
          ) : lineItems.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No beam details available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 border">Sized Beam No</th>
                    <th className="p-2 border">Weaver Name</th>
                    <th className="p-2 border">Weaving Contract No</th>
                    <th className="p-2 border">Sales Order No</th>
                    <th className="p-2 border">Empty Beam No</th>
                    <th className="p-2 border">Beam Meters</th>
                    <th className="p-2 border">Width</th>
                    <th className="p-2 border">Expected Fabric Meter</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map(item => (
                    <tr key={item.key}>
                      <td className="p-2 border">{item.sizedBeamNo || "-"}</td>
                      <td className="p-2 border">{item.weaverName || "-"}</td>
                      <td className="p-2 border">{item.weavingContractNo || "-"}</td>
                      <td className="p-2 border">{item.salesOrderNo || "-"}</td>
                      <td className="p-2 border">{item.flangeNo || "-"}</td>
                      <td className="p-2 border text-right">
                        {Number(item.beamMeters || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border text-right">
                        {Number(item.width || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border text-right">
                        {Number(item.expectedFabricMeter || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
