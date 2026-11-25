export interface WarpingFormData {
  id?: number | null;
  warpingProductionNo: string;
  warpingDate: string;
  sizingOrderId: string;
  buyerName: string;
  manualSetNo: string;
  parts: string;
  endsPerPart: string;
  machineId: string;
  yarnName: string;
  buyerId: string;
  yarnId: string;
}

export interface ProductionRow {
  tempId: string;
  shift: string;
  shiftName: string;
  warpBeamNo: string;
  endsPerPart: string;
  startTime: string;
  endTime: string;
  actualMeters: string;
  breakages: string;
  rpm: string;
  tareWt: string;
  grossWt: string;
  netWt: string;
  employeeId: string;
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
  shift: "",
  shiftName: "",
  warpBeamNo: "",
  endsPerPart: "",
  startTime: "",
  endTime: "",
  actualMeters: "",
  breakages: "",
  rpm: "",
  tareWt: "",
  grossWt: "",
  netWt: "",
  employeeId: "",
});

export const toDateInputValue = (value?: string | null) => {
  if (value && value.length >= 10) return value.slice(0, 10);
  return new Date().toISOString().slice(0, 10);
};

export const safeNumber = (value: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return "0.00";
  return value.toFixed(2);
};

// export const hydrateRows = (record: any): ProductionRow[] => {
//   const rows = extractArray(record?.productionDetails);
//   if (!rows.length) return [createEmptyRow()];
//   return rows.map((detail: any, index: number) => ({
//     tempId: `edit-${record?.id ?? ""}-${index}`,
//     shift: detail?.shift ? String(detail.shift) : "",
//     shiftName: detail?.shiftName ? String(detail.shiftName) : "",
//     warpBeamNo: detail?.warpBeamNo ? String(detail.warpBeamNo) : "",
//     endsPerPart: detail?.endsPerPart != null ? String(detail.endsPerPart) : "",
//     startTime: detail?.startTime ? String(detail.startTime) : "",
//     endTime: detail?.endTime ? String(detail.endTime) : "",
//     actualMeters: detail?.actualMeters != null ? String(detail.actualMeters) : "",
//     breakages: detail?.breakages != null ? String(detail.breakages) : "",
//     rpm: detail?.rpm != null ? String(detail.rpm) : "",
//     tareWt: detail?.tareWt != null ? String(detail.tareWt) : "",
//     grossWt: detail?.grossWt != null ? String(detail.grossWt) : "",
//     netWt: detail?.netWt != null ? String(detail.netWt) : "",
//     employeeId: detail?.employeeId
//       ? String(detail.employeeId)
//       : detail?.employee?.id
//         ? String(detail.employee.id)
//         : "",
//   }));
// };

// In warping-production-shared.ts or wherever hydrateRows is defined
export const hydrateRows = (initialRecord: any): ProductionRow[] => {
  if (!initialRecord) return [createEmptyRow()];
  
  const details = extractArray(initialRecord.productionDetails);
  
  if (details.length === 0) {
    const parts = Number(initialRecord.parts) || 1;
    return Array.from({ length: parts }, () => createEmptyRow());
  }
  
  return details.map((detail: any) => ({
    tempId: detail.id ? `detail-${detail.id}` : `temp-${Date.now()}-${Math.random()}`,
    shift: detail.shift || "",
    shiftName: detail.shiftName || "",
    warpBeamNo: detail.warpBeamNo || "",
    endsPerPart: detail.endsPerPart != null ? String(detail.endsPerPart) : (initialRecord.endsPerPart != null ? String(initialRecord.endsPerPart) : ""),
    startTime: detail.startTime || "",
    endTime: detail.endTime || "",
    actualMeters: detail.actualMeters != null ? String(detail.actualMeters) : "",
    breakages: detail.breakages != null ? String(detail.breakages) : "",
    rpm: detail.rpm != null ? String(detail.rpm) : "",
    tareWt: detail.tareWt != null ? String(detail.tareWt) : "",
    grossWt: detail.grossWt != null ? String(detail.grossWt) : "",
    netWt: detail.netWt != null ? String(detail.netWt) : 
           (detail.grossWt != null && detail.tareWt != null) ? String(detail.grossWt - detail.tareWt) : "",
    employeeId: detail.employeeId != null ? String(detail.employeeId) : "",
  }));
};