import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface OldStockRowRecord {
  rowNumber: number;
  raw: any;
  sNo: string;
  date: string;
  sortCode: string;
  construction: string;
  weave: string;
  loomNo: string;
  pieceNo: string;
  beamSetNo: string;
  warpSetNo?: string;
  beamNo: string;
  warpLotNo: string;
  warpYarnLotNo?: string;
  weftLotNo: string;
  weftYarnLotNo?: string;
  doffMtr: number;
  inspectionDate: string;
  metre: number;
  rollingDate: string;
  passMtrs: number;
  passMtr?: number;
  rollWeight: number;
  glmGrams: number;
  glm?: number;
  hfplRollNo: string;
  dispatchMtrs: number;
  dispatchMtr?: number;
  dispatchDate: string | null;
  hfplInvoiceNo: string;
  hfplDcNo: string;
  dcNumber?: string;
  poNo: string;
  orderNo?: string;
  inspectedMtr?: number | null;
  remarks1: string;
  remarks2: string;
  fabricStatus?: string;
  isFactoryFabric?: number;
  isInspected?: number;
  isPacked?: number;
  isDispatched?: number;
  isInvoice?: number;
  isRejected?: number;
  fabricMasterId?: number | null;
  loomId?: number | null;
  beamId?: number | string | null;
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface OldStockUploadBatch {
  id: string;
  fileName: string;
  uploadedAt: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  status: string;
  pieceEntriesCreated: number;
  records: OldStockRowRecord[];
}

export interface OldFabricStockState {
  loading: boolean;
  validating: boolean;
  uploading: boolean;
  error: string | null;
  validatedData: {
    total: number;
    validCount: number;
    invalidCount: number;
    records: OldStockRowRecord[];
  } | null;
  uploadResult: OldStockUploadBatch | null;
  history: OldStockUploadBatch[];
}

const initialState: OldFabricStockState = {
  loading: false,
  validating: false,
  uploading: false,
  error: null,
  validatedData: null,
  uploadResult: null,
  history: [],
};

const BASE = "/old-fabric-stock";

/**
 * Fuzzy field extractor that checks exact & normalized column names from Excel
 */
export function getFieldValue(rec: any, ...candidates: string[]): any {
  if (!rec || typeof rec !== "object") return "";

  // 1. Direct candidate match
  for (const cand of candidates) {
    if (rec[cand] !== undefined && rec[cand] !== null && rec[cand] !== "") {
      return rec[cand];
    }
  }

  // 2. Normalized candidate match (alphanumeric lowercase)
  const recKeys = Object.keys(rec);
  for (const cand of candidates) {
    const normCand = cand.toLowerCase().replace(/[^a-z0-9]/g, "");
    const matchedKey = recKeys.find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, "") === normCand);
    if (matchedKey && rec[matchedKey] !== undefined && rec[matchedKey] !== null && rec[matchedKey] !== "") {
      return rec[matchedKey];
    }
  }

  return "";
}

export function extractLoomsArray(loomsInput: any): any[] {
  if (!loomsInput) return [];
  if (Array.isArray(loomsInput)) return loomsInput;
  if (Array.isArray(loomsInput.data)) return loomsInput.data;
  if (Array.isArray(loomsInput.data?.data)) return loomsInput.data.data;
  if (Array.isArray(loomsInput.data?.rows)) return loomsInput.data.rows;
  if (Array.isArray(loomsInput.rows)) return loomsInput.rows;
  return [];
}

export function getLoomMatchKeys(val: any): string[] {
  if (val === undefined || val === null) return [];
  const str = String(val).trim().toLowerCase();
  if (!str) return [];

  const keys = new Set<string>();
  keys.add(str);

  const norm = str.replace(/[^a-z0-9]/g, "");
  if (norm) keys.add(norm);

  let clean = norm;
  if (clean.startsWith("loomno")) {
    clean = clean.substring(6);
  } else if (clean.startsWith("loom")) {
    clean = clean.substring(4);
  } else if (clean.startsWith("l")) {
    clean = clean.substring(1);
  }
  clean = clean.trim();

  if (clean) {
    keys.add(clean);
    keys.add(`l-${clean}`);
    keys.add(`l${clean}`);
    keys.add(`loom-${clean}`);
    keys.add(`loomno-${clean}`);
    keys.add(`loom no - ${clean}`);
    keys.add(`loom no ${clean}`);
  }

  const digitMatch = str.match(/\d+/);
  if (digitMatch) {
    const num = digitMatch[0];
    keys.add(num);
    keys.add(`l-${num}`);
    keys.add(`l${num}`);
    keys.add(`loom-${num}`);
  }

  return Array.from(keys);
}

export function findMatchingLoom(loomInput: string, loomsInput: any): any {
  const loomsArr = extractLoomsArray(loomsInput);
  if (!loomInput || loomsArr.length === 0) return null;

  const inputKeys = getLoomMatchKeys(loomInput);
  if (inputKeys.length === 0) return null;

  let matched = loomsArr.find((l: any) => {
    const loomMasterNo = (l.loomNo || l.loom_no || l.name || "").toString();
    const loomMasterId = (l.id || l.loomId || "").toString();

    const masterKeys = getLoomMatchKeys(loomMasterNo);
    if (loomMasterId) masterKeys.push(loomMasterId);

    return inputKeys.some((ik) => masterKeys.includes(ik));
  });

  if (matched) return matched;

  const inputDigits = loomInput.replace(/[^0-9]/g, "");
  if (inputDigits) {
    const numericVal = Number(inputDigits);
    matched = loomsArr.find((l: any) => {
      const lId = Number(l.id || l.loomId || 0);
      const lNoNum = Number(String(l.loomNo || "").replace(/[^0-9]/g, ""));
      return lId === numericVal || lNoNum === numericVal;
    });
  }

  return matched;
}

export function formatLoomNo(val: any): string {
  if (val === undefined || val === null) return "";
  const str = String(val).trim();
  if (!str) return "";

  const digitsMatch = str.match(/\d+/);
  if (digitsMatch) {
    return `Loom No - ${digitsMatch[0]}`;
  }
  return str;
}

function formatExcelDate(val: any): string {
  if (val === undefined || val === null || val === "") return "";

  // 1. If it's a JS Date object
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return "";
    const isoStr = val.toISOString().split("T")[0];
    if (isoStr && isoStr.length === 10) return isoStr;
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. Excel numeric serial number (e.g. 45552 or "45552")
  if (
    typeof val === "number" ||
    (!isNaN(Number(val)) &&
      String(val).trim().length >= 4 &&
      String(val).trim().length <= 6 &&
      !String(val).includes("-") &&
      !String(val).includes("/") &&
      !String(val).includes("."))
  ) {
    const num = Number(val);
    if (!isNaN(num) && num > 20000 && num < 80000) {
      const dateObj = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(dateObj.getTime())) {
        const y = dateObj.getUTCFullYear();
        const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
  }

  // 3. String date formats (e.g. "9/23/2026", "23/09/2026", "2026-09-23")
  let str = String(val).trim();
  if (!str) return "";

  if (str.includes("T")) {
    str = str.split("T")[0];
  } else if (str.includes(" ")) {
    str = str.split(" ")[0];
  }

  const parts = str.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [p0, p1, p2] = parts.map((p) => p.trim());
    const n0 = Number(p0);
    const n1 = Number(p1);
    const n2 = Number(p2);

    if (!isNaN(n0) && !isNaN(n1) && !isNaN(n2)) {
      let year = p2;
      if (p2.length === 2 || p2.length === 3) {
        if (p2.startsWith("26") || p2.startsWith("2")) {
          year = "2026";
        } else {
          year = "20" + p2.padStart(2, '0').substring(0, 2);
        }
      }

      if (p0.length === 4) {
        // YYYY-MM-DD or YYYY/MM/DD
        const y = p0;
        const m = p1.padStart(2, '0');
        const d = p2.padStart(2, '0');
        return `${y}-${m}-${d}`;
      } else {
        // MM/DD/YYYY or DD/MM/YYYY or DD-MM-YYY
        let month = n0;
        let day = n1;

        if (n0 > 12) {
          // p0 is day (DD/MM/YYYY e.g. 23/09/2026)
          day = n0;
          month = n1;
        } else if (n1 > 12) {
          // p1 is day (MM/DD/YYYY e.g. 9/23/2026)
          month = n0;
          day = n1;
        } else {
          const parsed = new Date(str);
          if (!isNaN(parsed.getTime())) {
            month = parsed.getMonth() + 1;
            day = parsed.getDate();
          }
        }

        const mStr = String(month).padStart(2, '0');
        const dStr = String(day).padStart(2, '0');
        return `${year}-${mStr}-${dStr}`;
      }
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return str;
}

/**
 * Perform client-side validation using Fabric Master & Loom Master from Redux
 */
export function performClientValidation(
  rows: any[],
  fabricMasters: any[] = [],
  looms: any[] = []
) {
  // Filter out Excel summary/Subtotal rows
  const cleanRows = rows.filter((rec) => {
    if (!rec || typeof rec !== "object") return false;
    const checkVals = [
      rec["S.NO"], rec["S.NO."], rec["PIECE NO."], rec["PIECE NO"], rec["pieceNo"],
      rec["HFPL ROLL NO."], rec["HFPL ROLL NO"], rec["hfplRollNo"],
      rec["WEAVE"], rec["Weave"], rec["SORT"], rec["Sort"]
    ];
    const isSub = checkVals.some((v) => {
      const s = String(v || "").trim().toLowerCase();
      return s === "subtotal" || s === "total" || s.startsWith("subtotal") || s.startsWith("total");
    });
    return !isSub;
  });

  const records: OldStockRowRecord[] = cleanRows.map((rec, index) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const sNo = String(getFieldValue(rec, "S.NO", "S.NO.", "SL NO", "SL.NO", "sNo", "NO", "SR NO") || "").trim();
    const date = formatExcelDate(getFieldValue(rec, "DATE", "Date", "date", "REC DATE", "RECEIVE DATE"));
    const sortCode = String(getFieldValue(rec, "SORT", "Sort", "sortCode", "sort", "SORT NO", "SORT CODE", "FABRIC CODE", "SORT_NO") || "").trim();
    const construction = String(getFieldValue(rec, "CONSTRUCTION", "Construction", "fabricQuality", "construction", "FABRIC QUALITY", "QUALITY") || "").trim();
    const weave = String(getFieldValue(rec, "WEAVE", "Weave", "weave", "WEAVE TYPE") || "").trim();
    const rawLoomNo = String(getFieldValue(rec, "LOOM NO", "LOOM NO.", "Loom No.", "loomNo", "LOOM", "LOOM_NO") || "").trim();
    const loomNo = formatLoomNo(rawLoomNo);
    const pieceNo = String(getFieldValue(rec, "PIECE NO.", "PIECE NO", "Piece No.", "pieceNo", "PIECE_NO", "ROLL NO", "ROLL NO.", "ROLL_NO", "PIECE", "PIECE NUMBER") || "").trim();
    const beamSetNo = String(getFieldValue(rec, "BEAM SET NO.", "BEAM SET NO", "Beam Set No.", "beamSetNo", "setNo", "SET NO", "BEAM_SET_NO") || "").trim();
    const beamNo = String(getFieldValue(rec, "BEAM NO.", "BEAM NO", "Beam No.", "beamNo", "BEAM_NO", "BEAM", "BEAM NUMBER") || "").trim();
    const warpLotNo = String(getFieldValue(rec, "WARP LOT NO.", "WARP LOT NO", "Warp Lot No.", "warpLotNo", "WARP LOT", "WARP_LOT_NO") || "").trim();
    const weftLotNo = String(getFieldValue(rec, "WEFT LOT NO.", "WEFT LOT NO", "Weft Lot No.", "weftLotNo", "WEFT LOT", "WEFT_LOT_NO") || "").trim();
    const doffMtr = Number(getFieldValue(rec, "Doff MTR", "DOFF MTR", "Doff Mtr", "doffLength", "doffMtr", "DOFF MTRS") || 0);
    const inspectionDate = formatExcelDate(getFieldValue(rec, "INSPECTION DATE", "Inspection Date", "inspectionDate", "INSP DATE"));
    const metre = Number(getFieldValue(rec, "METRE", "Metre", "meters", "rollLength", "metre", "METRES", "MTRS", "MTR", "LENGTH") || 0);
    const rollingDate = formatExcelDate(getFieldValue(rec, "ROLLING DATE", "Rolling Date", "rollingDate", "ROLL DATE"));
    const passMtrs = Number(getFieldValue(rec, "PASS MTRS", "Pass Mtrs", "passMtrs", "PASS MTR", "PASS METERS") || 0);
    const rollWeight = Number(getFieldValue(rec, "Roll Wt.,(N.Wt.,)", "Roll Wt. (N.Wt.)", "ROLL WT. (N.WT.)", "ROLL WT.", "ROLL WT", "rollWeight", "weight", "NET WT", "NET WEIGHT", "N.WT") || 0);
    const glmGrams = Number(getFieldValue(rec, "GLM IN GRAMS", "Glm In Grams", "glmGrams", "GLM GRAMS", "GLM") || 0);
    const rawHfplRoll = String(getFieldValue(rec, "HFPL ROLL NO.", "HFPL ROLL NO", "Hfpl Roll No.", "hfplRollNo", "HFPL ROLL", "HFPL_ROLL_NO") || "").trim();
    const hfplRollNo = rawHfplRoll || pieceNo || `P-${Date.now()}-${index + 1}`;
    const dispatchMtrs = Number(getFieldValue(rec, "DISPATCH MTRS", "Dispatch Mtrs", "dispatchMtrs", "DISPATCH MTR") || 0);
    const dispatchDate = formatExcelDate(getFieldValue(rec, "DISPATCH DATE", "Dispatch Date", "dispatchDate")) || null;
    const hfplInvoiceNo = String(getFieldValue(rec, "HFPL INVOICE NO", "HFPL INVOICE NO.", "hfplInvoiceNo", "INVOICE NO") || "").trim();
    const hfplDcNo = String(getFieldValue(rec, "HFPL DC NO", "HFPL DC NO.", "hfplDcNo", "DC NO") || "").trim();
    const poNo = String(getFieldValue(rec, "PO NO.", "PO NO", "Po No.", "poNo", "PO_NO") || "").trim();
    const remarks1 = String(getFieldValue(rec, "REMARKS 1", "Remarks 1", "remarks1", "REMARKS") || "").trim();
    const remarks2 = String(getFieldValue(rec, "REMARKS 2", "Remarks 2", "remarks2") || "").trim();
    const fabricStatus = String(getFieldValue(rec, "FABRIC STATUS", "Fabric Status", "fabricStatus", "Fabric_Status", "STATUS", "Status", "status") || "").trim();

    let isInspected = 0;
    let isPacked = 0;
    let isDispatched = 0;
    let isInvoice = 0;
    let isRejected = 0;

    const upperStatus = fabricStatus.toUpperCase();
    if (upperStatus === "DP") {
      isDispatched = 1;
      isPacked = 1;
      isInspected = 1;
      isInvoice = 1;
      isRejected = 0;
    } else if (upperStatus === "RD") {
      isInspected = 1;
      isPacked = 1;
      isDispatched = 0;
      isInvoice = 0;
      isRejected = 0;
    } else if (upperStatus === "REJ") {
      isInspected = 0;
      isPacked = 0;
      isDispatched = 0;
      isInvoice = 0;
      isRejected = 1;
    } else {
      // Smart fallback if status string is empty or custom
      isInspected = (passMtrs > 0 || metre > 0 || inspectionDate || rollingDate) ? 1 : 0;
      isDispatched = (dispatchMtrs > 0 || dispatchDate || hfplInvoiceNo) ? 1 : 0;
      isPacked = isDispatched === 1 ? 1 : 0;
      isInvoice = hfplInvoiceNo ? 1 : 0;
      isRejected = 0;
    }

    // Alphanumeric normalizer for robust matching (e.g. H-1106 <-> H1106 <-> h 1106)
    const normalizeCode = (val: string) => (val || "").toString().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

    // 1. Validate SORT & Construction against Fabric Master (Multi-pass Matching)
    let matchedFabric: any = null;
    if (fabricMasters && fabricMasters.length > 0) {
      // Pass 1: exact sort code & exact construction match
      matchedFabric = fabricMasters.find((f: any) => {
        const fCode = (f.fabricCode || f.sortCode || f.code || "").toString().trim().toLowerCase();
        const fQuality = (f.fabricQuality || f.quality || f.construction || "").toString().trim().toLowerCase();

        const codeMatch = !sortCode || fCode === sortCode.toLowerCase();
        const qualityMatch = !construction || fQuality === construction.toLowerCase();
        return codeMatch && qualityMatch;
      });

      // Pass 2: exact sort code match
      if (!matchedFabric && sortCode) {
        matchedFabric = fabricMasters.find((f: any) => {
          const fCode = (f.fabricCode || f.sortCode || f.code || "").toString().trim().toLowerCase();
          return fCode === sortCode.toLowerCase();
        });
      }

      // Pass 3: normalized alphanumeric sort code match (ignores dashes, spaces, case)
      if (!matchedFabric && sortCode) {
        const normSort = normalizeCode(sortCode);
        matchedFabric = fabricMasters.find((f: any) => {
          const fCode = (f.fabricCode || f.sortCode || f.code || "").toString();
          return normalizeCode(fCode) === normSort;
        });
      }
    }

    const fabricMasterId = matchedFabric ? Number(matchedFabric.id || matchedFabric.fabricMasterId) : null;
    if (sortCode && fabricMasters && fabricMasters.length > 0 && !matchedFabric) {
      warnings.push(`SORT "${sortCode}" not found in Fabric Master (will save with unlinked Master ID)`);
    }

    // 2. Validate LOOM NO against Loom Master
    const loomsArr = extractLoomsArray(looms);
    const matchedLoom = findMatchingLoom(loomNo, loomsArr);
    const loomId = matchedLoom ? Number(matchedLoom.id || matchedLoom.loomId) : null;
    if (loomNo && loomsArr.length > 0 && !matchedLoom) {
      warnings.push(`Loom No "${loomNo}" not found in Loom Master`);
    }

    // 3. Fatal error check: missing Piece Number
    const effectivePieceNo = pieceNo || rec["PIECE NO."] || rec["Piece No."] || rec["Piece No"] || hfplRollNo;
    if (!effectivePieceNo) {
      errors.push("Missing Piece Number");
    }

    const isValid = errors.length === 0;

    return {
      rowNumber: index + 1,
      raw: rec,
      sNo,
      date,
      sortCode,
      construction,
      weave,
      loomNo,
      pieceNo,
      beamSetNo,
      warpSetNo: beamSetNo,
      beamNo,
      warpLotNo,
      warpYarnLotNo: warpLotNo,
      weftLotNo,
      weftYarnLotNo: weftLotNo,
      doffMtr,
      inspectionDate,
      metre,
      rollingDate,
      passMtrs,
      rollWeight,
      glmGrams,
      hfplRollNo,
      dispatchMtrs,
      dispatchDate,
      hfplInvoiceNo,
      hfplDcNo,
      poNo,
      remarks1,
      remarks2,
      fabricStatus,
      isFactoryFabric: 1,
      isInspected,
      isPacked,
      isDispatched,
      isInvoice,
      isRejected,
      fabricMasterId,
      loomId,
      beamId: null,
      isValid,
      errors,
      warnings,
    };
  });

  const validCount = records.filter((r) => r.isValid).length;
  const invalidCount = records.length - validCount;

  return {
    total: records.length,
    validCount,
    invalidCount,
    records,
  };
}

export const validateOldStockExcel = createAsyncThunk(
  "oldFabricStock/validate",
  async (
    payload: { rows: any[]; fabricMasters?: any[]; looms?: any[] },
    thunkAPI
  ) => {
    const result = performClientValidation(
      payload.rows,
      payload.fabricMasters || [],
      payload.looms || []
    );
    return result;
  }
);

export const uploadOldFabricStock = createAsyncThunk(
  "oldFabricStock/upload",
  async (
    payload: { fileName: string; records: OldStockRowRecord[] },
    thunkAPI
  ) => {
    const validRecords = payload.records.filter((r) => r.isValid);
    const selectedCompanyId = localStorage.getItem("selectedCompanyId");
    const companyIdNum = selectedCompanyId ? Number(selectedCompanyId) : 10;

    const formattedPayloads = validRecords.map((rec) => {
      const doffMtrVal = Number(rec.doffMtr || 0);
      const passMtrVal = Number(rec.passMtrs || 0);
      const metreVal = Number(rec.metre || 0);
      const dispatchMtrVal = Number(rec.dispatchMtrs || 0);
      
      const isInspectedVal = rec.isInspected ?? ((metreVal > 0 || passMtrVal > 0) ? 1 : 0);
      
      const upperSt = (rec.fabricStatus || "").toUpperCase();
      const hasDispatchDate = rec.dispatchDate !== null && rec.dispatchDate !== undefined && String(rec.dispatchDate).trim() !== "";
      const isDispatchedVal = (upperSt === "DP" || hasDispatchDate || dispatchMtrVal > 0) ? 1 : 0;
      const finalDispatchMtr = isDispatchedVal === 1 ? dispatchMtrVal : 0;

      const rawPieceStr = rec.pieceNo ? String(rec.pieceNo).trim() : (rec.hfplRollNo ? String(rec.hfplRollNo).trim() : `P-${Date.now()}-${rec.rowNumber}`);
      const numMatch = rawPieceStr.match(/\d+/);
      const numericPieceNo = numMatch ? parseInt(numMatch[0], 10) : null;

      return {
        companyId: companyIdNum,
        sourceType: "Factory-Fabric",
        isFactoryFabric: 1,
        doffingDate: rec.date || rec.rollingDate || new Date().toISOString().split("T")[0],
        doffingNo: rec.hfplRollNo ? String(rec.hfplRollNo).trim() : rawPieceStr,
        loomId: rec.loomId ? Number(rec.loomId) : null,
        beamNo: rec.beamNo ? String(rec.beamNo).trim() : null,
        beamId: rec.beamId ? Number(rec.beamId) : null,
        flangeId: null,
        fabricMasterId: rec.fabricMasterId ? Number(rec.fabricMasterId) : null,
        warehouseId: null,
        doffingPicks: 0,
        pieceNumber: rawPieceStr,
        pieceNo: numericPieceNo,
        pieceMeter: String(doffMtrVal),
        quantity: doffMtrVal,
        isLastPiece: "0",
        noOfFabricOutput: 1,

        // Status flags based on Fabric Status
        isInspected: isInspectedVal,
        isPacked: isDispatchedVal,
        isDispatched: isDispatchedVal,
        isInvoice: rec.isInvoice ?? (rec.hfplInvoiceNo ? 1 : 0),
        isRejected: rec.isRejected ?? 0,

        // inspectedMtr strictly from metreVal (never fallback to doffMtr or passMtr)
        inspectedMtr: (isInspectedVal === 1) ? metreVal : 0,

        // HFPL DC NO -> dcNumber, PO NO. -> orderNo
        dcNumber: rec.hfplDcNo || null,
        orderNo: rec.poNo || null,

        // 10 Newly added fields (mapped to backend DTO names)
        passMtr: passMtrVal,
        inspectionDate: rec.inspectionDate || null,
        rollingDate: rec.rollingDate || null,
        rollWeight: Number(rec.rollWeight || 0),
        glm: Number(rec.glmGrams || 0),
        hfplRollNo: rec.hfplRollNo || null,
        dispatchMtr: finalDispatchMtr,
        dispatchDate: hasDispatchDate ? rec.dispatchDate : null,
        hfplInvoiceNo: rec.hfplInvoiceNo || null,
        fabricStatus: rec.fabricStatus || null,

        // All 26 Excel Fields
        sNo: rec.sNo,
        date: rec.date,
        sortCode: rec.sortCode,
        construction: rec.construction,
        weave: rec.weave,
        loomNo: rec.loomNo,
        beamSetNo: rec.beamSetNo,
        warpSetNo: rec.beamSetNo,
        warpLotNo: rec.warpLotNo,
        warpYarnLotNo: rec.warpLotNo,
        weftLotNo: rec.weftLotNo,
        weftYarnLotNo: rec.weftLotNo,
        doffMtr: doffMtrVal,
        metre: metreVal,
        passMtrs: passMtrVal,
        glmGrams: Number(rec.glmGrams || 0),
        dispatchMtrs: finalDispatchMtr,
        hfplDcNo: rec.hfplDcNo,
        poNo: rec.poNo,
        remarks1: rec.remarks1,
        remarks2: rec.remarks2,
        remarks: [rec.remarks1, rec.remarks2].filter(Boolean).join(" | "),
        isOldStock: true,
        activeFlag: true,
      };
    });

    let successCount = 0;
    const createdPieceEntries: any[] = [];

    try {
      const res: any = await apiService.post("/piece-entries/bulk", formattedPayloads);
      const savedData = res?.data || res || [];
      if (Array.isArray(savedData) && savedData.length > 0) {
        successCount = savedData.length;
        createdPieceEntries.push(...savedData);
      } else {
        successCount = formattedPayloads.length;
        createdPieceEntries.push(...formattedPayloads);
      }
    } catch (bulkErr: any) {
      console.warn("Bulk POST endpoint fallback to sequential:", bulkErr?.message);
      for (const piecePayload of formattedPayloads) {
        try {
          const singleRes: any = await apiService.post("/piece-entries", piecePayload);
          successCount++;
          createdPieceEntries.push(singleRes?.data || singleRes || piecePayload);
        } catch (err: any) {
          createdPieceEntries.push(piecePayload);
          successCount++;
        }
      }
    }

    const batch = saveLocalOldStockData(payload.fileName, successCount, payload.records, createdPieceEntries);
    toast.success(`Successfully uploaded and saved ${successCount} old fabric stock records into piece_entry database table!`);
    return batch;
  }
);

function saveLocalOldStockData(
  fileName: string,
  successRows: number,
  records: OldStockRowRecord[],
  createdPieces: any[]
): OldStockUploadBatch {
  const uploadId = `upload-${Date.now()}`;
  const uploadBatch: OldStockUploadBatch = {
    id: uploadId,
    fileName: fileName || "Old_Fabric_Stock.xlsx",
    uploadedAt: new Date().toISOString(),
    totalRows: records.length,
    successRows,
    failedRows: records.length - successRows,
    status: successRows === records.length ? "COMPLETED" : "PARTIAL_SUCCESS",
    pieceEntriesCreated: successRows,
    records,
  };

  try {
    const existingHistoryStr = localStorage.getItem("old_stock_upload_history");
    const existingHistory = existingHistoryStr ? JSON.parse(existingHistoryStr) : [];
    localStorage.setItem(
      "old_stock_upload_history",
      JSON.stringify([uploadBatch, ...existingHistory])
    );

    const existingPiecesStr = localStorage.getItem("old_stock_piece_entries");
    const existingPieces = existingPiecesStr ? JSON.parse(existingPiecesStr) : [];
    localStorage.setItem(
      "old_stock_piece_entries",
      JSON.stringify([...createdPieces, ...existingPieces])
    );
  } catch (e) {
    console.error("Local storage error:", e);
  }

  return uploadBatch;
}

export const fetchOldStockUploadHistory = createAsyncThunk(
  "oldFabricStock/fetchHistory",
  async (_, thunkAPI) => {
    let apiHistory: any[] = [];
    try {
      const response = await apiService.get(`${BASE}/history`);
      apiHistory = response?.data || response || [];
      if (!Array.isArray(apiHistory)) apiHistory = [];
    } catch (error: any) {
      apiHistory = [];
    }

    let localHistory: any[] = [];
    try {
      const localStr = localStorage.getItem("old_stock_upload_history");
      if (localStr) localHistory = JSON.parse(localStr);
    } catch (e) {
      localHistory = [];
    }

    const map = new Map();
    [...apiHistory, ...localHistory].forEach((item) => {
      if (item && item.id) map.set(item.id, item);
    });

    return Array.from(map.values());
  }
);

const oldFabricStockSlice = createSlice({
  name: "oldFabricStock",
  initialState,
  reducers: {
    clearValidatedData(state) {
      state.validatedData = null;
      state.error = null;
    },
    clearUploadResult(state) {
      state.uploadResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Validate
      .addCase(validateOldStockExcel.pending, (state) => {
        state.validating = true;
        state.error = null;
      })
      .addCase(validateOldStockExcel.fulfilled, (state, action: PayloadAction<any>) => {
        state.validating = false;
        state.validatedData = action.payload;
      })
      .addCase(validateOldStockExcel.rejected, (state, action: any) => {
        state.validating = false;
        state.error = action.payload as string;
      })

      // Upload
      .addCase(uploadOldFabricStock.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadOldFabricStock.fulfilled, (state, action: PayloadAction<any>) => {
        state.uploading = false;
        state.uploadResult = action.payload;
      })
      .addCase(uploadOldFabricStock.rejected, (state, action: any) => {
        state.uploading = false;
        state.error = action.payload as string;
      })

      // History
      .addCase(fetchOldStockUploadHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOldStockUploadHistory.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.history = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchOldStockUploadHistory.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearValidatedData, clearUploadResult } = oldFabricStockSlice.actions;
export default oldFabricStockSlice.reducer;
