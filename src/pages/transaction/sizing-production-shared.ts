export interface SizingProductionFormData {
  id?: number | null;
  sizingProductionNo: string;
  sizingDate: string;
  sizingOrderId: string;
  sizingPlanId: string;
  sizingPlanNo: string;
  buyerName: string;
  buyerId: string;
  manualSetNo: string;
  yarnName: string;
  yarnId: string;
  machineId: string;
  machineName: string;
}

export interface ProductionRow {
  tempId: string;
  shiftName: string;
  flangeNo: string;
  flangeId: string;
  fabricPanelWidth: string;
  expectedFabricMeter: string;
  totalEnds: string;
  sizedBeamNo: string;
  beamMeters: string;
  sizingPickup: string;
  breakages: string;
  rpm: string;
  tareWt: string;
  grossWt: string;
  netWt: string;
  employeeId: string;
  isExpectedFabricMeterModified?: boolean;
}

export const extractArray = (input: any): any[] => {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.data)) return input.data;
  if (Array.isArray(input?.items)) return input.items;
  if (Array.isArray(input?.results)) return input.results;
  return [];
};

export const createEmptyRow = (): ProductionRow => ({
  tempId: `row-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  shiftName: "",
  flangeNo: "",
  flangeId: "",
  fabricPanelWidth: "",
  expectedFabricMeter: "",
  totalEnds: "",
  sizedBeamNo: "",
  beamMeters: "",
  sizingPickup: "",
  breakages: "",
  rpm: "",
  tareWt: "",
  grossWt: "",
  netWt: "",
  employeeId: "",
  isExpectedFabricMeterModified: false,
});

const formatDate = (date: Date) => {
  return date.toISOString().slice(0, 10);
};

const tryParseDateString = (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) {
    return formatDate(direct);
  }
  const tokens = trimmed.split(/[\/\-.]/).map((token) => token.trim());
  if (tokens.length === 3) {
    const [first, second, third] = tokens;
    if (third.length === 4 && first.length <= 2 && second.length <= 2) {
      const day = Number(first);
      const month = Number(second);
      const year = Number(third);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1000) {
        const constructed = new Date(Date.UTC(year, month - 1, day));
        return formatDate(constructed);
      }
    }
  }
  return null;
};

export const toDateInputValue = (value?: string | number | Date | null) => {
  if (value instanceof Date) {
    return formatDate(value);
  }
  if (typeof value === "number") {
    const numericDate = new Date(value);
    if (!Number.isNaN(numericDate.getTime())) {
      return formatDate(numericDate);
    }
  }
  if (typeof value === "string") {
    const resolved = tryParseDateString(value);
    if (resolved) return resolved;
  }
  return formatDate(new Date());
};

export const safeNumber = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return "0.00";
  return value.toFixed(2);
};

export const hydrateRows = (record: any): ProductionRow[] => {
  const rows = extractArray(record?.productionDetails);
  if (!rows.length) return [createEmptyRow()];
  return rows.map((detail: any, index: number) => {
    const pickupCandidate =
      detail?.sizingPickup ??
      detail?.sizingPickUp ??
      detail?.sizing_pickup ??
      detail?.sizing_pickUp;
    return {
      tempId: `edit-${record?.id ?? ""}-${index}`,
      shiftName: detail?.shiftName ? String(detail.shiftName) : "",
      flangeNo: detail?.flangeNo ? String(detail.flangeNo) : "",
      flangeId: detail?.flangeId != null ? String(detail.flangeId) : "",
      fabricPanelWidth: detail?.fabricPanelWidth != null ? String(detail.fabricPanelWidth) : "",
      expectedFabricMeter: detail?.expectedFabricMeter != null ? String(detail.expectedFabricMeter) : "",
      totalEnds: detail?.totalEnds != null ? String(detail.totalEnds) : "",
      sizedBeamNo: detail?.sizedBeamNo != null ? String(detail.sizedBeamNo) : "",
      beamMeters: detail?.beamMeters != null ? String(detail.beamMeters) : "",
      sizingPickup: pickupCandidate != null ? String(pickupCandidate) : "",
      breakages: detail?.breakages != null ? String(detail.breakages) : "",
      rpm: detail?.rpm != null ? String(detail.rpm) : "",
      tareWt: detail?.tareWt != null ? String(detail.tareWt) : "",
      grossWt: detail?.grossWt != null ? String(detail.grossWt) : "",
      netWt: detail?.netWt != null ? String(detail.netWt) : "",
      employeeId:
        detail?.employeeId != null
          ? String(detail.employeeId)
          : detail?.employee?.id != null
            ? String(detail.employee.id)
            : "",
      isExpectedFabricMeterModified: detail?.isExpectedFabricMeterModified ?? false,
    };
  });
};
