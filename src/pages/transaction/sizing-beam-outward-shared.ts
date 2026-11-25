export interface SizingBeamOutwardFormData {
  id: number | null;
  sizingBeamOutwardNo: string;
  outwardDate: string;
  orderType: "Internal" | "External" | "";
  sizingOrderId: string;
  sizingOrderNo: string;
  sizingPlanId: string;
  sizingPlanNo: string;
  buyerName: string;
  buyerId: string;
  deliveryAt: string[];
  yarnName: string;
  yarnId: string;
}

export interface BeamDetailRow {
  tempId: string;
  sizedBeamNo: string;
  width: string;
  shrinkage: string;
  expectedFabricMeter: string;
  totalEnds: string;
  beamMeters: string;
  flangeNo: string;
  flangeId: string;
  weavingContractNo: string;
  salesOrderNo: string;
  weavingContractId: string;
  salesOrderId: string;
  weavingVendorId: string;
  weavingVendorName: string;
}

export const extractArray = (input: any): any[] => {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.data)) return input.data;
  if (Array.isArray(input?.items)) return input.items;
  if (Array.isArray(input?.results)) return input.results;
  if (Array.isArray(input?.rows)) return input.rows;
  return [];
};

export const formatNumber = (value: number | string | null | undefined) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return "0.00";
  return numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const toFiniteNumber = (value: any) => {
  if (value == null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export const calculateExpectedFabricMeter = (
  beamMetersValue?: string | number,
  widthValue?: string | number,
  shrinkageValue?: string | number,
) => {
  const beamMeters = toFiniteNumber(beamMetersValue);
  const width = toFiniteNumber(widthValue);
  if (beamMeters == null || width == null) return "";
  const shrinkage = toFiniteNumber(shrinkageValue);
  const shrinkFactor = shrinkage != null ? shrinkage / 100 : 0;
  const base = beamMeters * width;
  const result = base - base * shrinkFactor;
  if (!Number.isFinite(result)) return "";
  return String(result);
};

export const createEmptyBeamRow = (): BeamDetailRow => ({
  tempId: `beam-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  sizedBeamNo: "",
  width: "",
  shrinkage: "",
  expectedFabricMeter: "",
  totalEnds: "",
  beamMeters: "",
  flangeNo: "",
  flangeId: "",
  weavingContractNo: "",
  salesOrderNo: "",
  weavingContractId: "",
  salesOrderId: "",
  weavingVendorId: "",
  weavingVendorName: "",
});

const resolveString = (value: any) => {
  if (value == null) return "";
  if (typeof value === "number" && !Number.isFinite(value)) return "";
  return String(value ?? "");
};

const resolveNumericString = (value: any) => {
  if (value == null) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return String(numeric);
};

export const hydrateBeamRows = (
  record: any,
  orderType?: string,
  preserveExternalFlange = false,
): BeamDetailRow[] => {
  const candidates = [
    extractArray(record?.sizingBeamDetails),
    extractArray(record?.beamDetails),
    extractArray(record?.details),
    extractArray(record?.productionDetails),
  ];
  const baseRows = candidates.find((rows) => rows.length) || [];
  if (!baseRows.length) return [createEmptyBeamRow()];
  return baseRows.map((detail: any, index: number) => ({
    tempId: detail?.tempId || `beam-${record?.id ?? "row"}-${index}`,
    sizedBeamNo: resolveString(detail?.sizedBeamNo ?? detail?.beamNo ?? detail?.beamNumber),
    width: resolveNumericString(detail?.width ?? detail?.fabricPanelWidth ?? detail?.beamWidth),
    shrinkage: resolveNumericString(detail?.shrinkage ?? detail?.shrinkagePercent ?? detail?.shrinkageValue),
    expectedFabricMeter: resolveNumericString(
      detail?.expectedFabricMeter ?? detail?.expectedFabricMeters ?? detail?.expectedMeter ?? detail?.expectedMeters,
    ),
    totalEnds: resolveNumericString(detail?.totalEnds ?? detail?.ends ?? detail?.totalEndCount ?? detail?.warpEnds ?? detail?.sordEnds),
    beamMeters: resolveNumericString(detail?.beamMeters ?? detail?.beamMeter ?? detail?.meters ?? detail?.warpMeters),
    flangeNo:
      orderType === "External" && !preserveExternalFlange
        ? ""
        : resolveString(detail?.flangeNo ?? detail?.flangeNumber),
    flangeId: resolveString(detail?.flangeId ?? detail?.flange?.id ?? detail?.flangeMasterId),
    weavingContractNo: resolveString(detail?.weavingContractNo ?? detail?.contractNo ?? detail?.weavingContractNumber),
    salesOrderNo: resolveString(detail?.salesOrderNo ?? detail?.salesOrderNumber ?? detail?.orderNo),
    weavingContractId: resolveString(detail?.weavingContractId ?? detail?.contractId),
    salesOrderId: resolveString(detail?.salesOrderId ?? detail?.salesId ?? detail?.salesOrderId),
    weavingVendorId: resolveString(detail?.weavingVendorId ?? detail?.vendorId ?? detail?.vendor?.id),
    weavingVendorName: resolveString(
      detail?.weaverName ?? detail?.vendorName ?? detail?.vendor?.vendorName ?? detail?.weavingVendorName,
    ),
  }));
};

export const summarizeBeamRows = (rows: BeamDetailRow[]) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  return safeRows.reduce(
    (acc, row) => {
      const ends = Number(row.totalEnds || 0);
      const meters = Number(row.beamMeters || 0);
      return {
        totalEnds: acc.totalEnds + (Number.isFinite(ends) ? ends : 0),
        totalBeamMeters: acc.totalBeamMeters + (Number.isFinite(meters) ? meters : 0),
        noOfBeams: acc.noOfBeams + 1,
      };
    },
    { totalEnds: 0, totalBeamMeters: 0, noOfBeams: 0 },
  );
};

export const resolveOrderType = (order: any, fallback: "Internal" | "External" | "" = ""): "Internal" | "External" | "" => {
  const raw = resolveString(order?.orderType || order?.orderTypeName || order?.type);
  const normalized = raw.toLowerCase();
  if (normalized.includes("external")) return "External";
  if (normalized.includes("internal")) return "Internal";
  const isExternal = String(order?.orderTypeId ?? order?.orderType)?.toLowerCase() === "external";
  if (isExternal) return "External";
  return fallback;
};

export const resolveOrderLabel = (order: any) => {
  const candidates = [
    order?.sizingOrderNo,
    order?.sizingJobWorkOrderNo,
    order?.jobWorkOrderNo,
    order?.orderNo,
    order?.sizingWorkOrderNo,
  ];
  const match = candidates.find((value) => value != null && String(value).trim() !== "");
  return match ? String(match) : "";
};

export const resolvePlanLabel = (plan: any) => {
  const candidates = [plan?.sizingPlanNo, plan?.planNo, plan?.planNumber, plan?.sizingPlanNumber];
  const match = candidates.find((value) => value != null && String(value).trim() !== "");
  return match ? String(match) : "";
};

export const resolveBuyerId = (record: any): number | null => {
  const candidates = [
    record?.buyerId,
    record?.customerId,
    record?.consigneeId,
    record?.companyId,
    record?.tradingCompanyId,
  ];
  const match = candidates.find((value) => value != null && String(value).trim() !== "");
  if (match == null) return null;
  const numeric = Number(match);
  return Number.isFinite(numeric) ? numeric : null;
};

export const resolveBuyerName = (record: any, fallback = "") => {
  const candidates = [
    record?.buyerName,
    record?.customerName,
    record?.consigneeName,
    record?.companyName,
    record?.tradingCompanyName,
  ];
  const match = candidates.find((value) => value != null && String(value).trim() !== "");
  return match ? String(match) : fallback;
};

export const resolveDeliveryNames = (plan: any, fallbackName?: string) => {
  const candidates = [
    extractArray(plan?.deliveryAtDetails).map((entry: any) => entry?.name || entry?.label),
    extractArray(plan?.deliveryLocations).map((entry: any) => entry?.name || entry?.locationName),
    extractArray(plan?.deliveries).map((entry: any) => entry?.deliveryName || entry?.name),
  ].flat();
  const normalized = candidates
    .map((value) => (value != null ? String(value).trim() : ""))
    .filter((value) => value !== "");
  if (normalized.length > 0) return normalized;
  if (fallbackName && fallbackName.trim()) return [fallbackName];
  return [];
};
