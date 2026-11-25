import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { formatDate, readExcelFile } from "@/lib/utils";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllFabricMasters, getAllFabricMastersForDropdown } from "@/state/fabricMasterSlice";
import { getAllBrushingReceivesByCompany, resetCurrentReceive, deleteBrushingReceive, getBrushingStock, createBrushingReceive } from "@/state/brushingSlice";
import { AppDispatch, RootState } from "@/state/store";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Upload } from "lucide-react";
import { toast } from "react-toastify";
import * as XLSX from 'xlsx';
import { DocumentAttachmentModal } from "@/components/modals/DocumentAttachmentModal";
import { useFileCounts } from "@/hooks/useFileCounts";

const getMatchableSignature = (str: string): string => {
    if (!str) return "";
    let clean = str.trim().toLowerCase();
    
    // Remove weave suffix like plain, satin, twill, drill, stripe, dobby, jacquard at the end
    clean = clean.replace(/\s+(plain|satin|twill|drill|stripe|dobby|jacquard)\b.*$/g, "");
    
    // Remove "s" immediately following a number (e.g. 20s -> 20, 8s -> 8)
    clean = clean.replace(/(\d+)s\b/g, "$1");
    
    // Normalize multipliers/stars/x's to a standard character (e.g. replace '*' with 'x')
    clean = clean.replace(/\*/g, "x");
    
    // Remove all quotation marks, backslashes, etc.
    clean = clean.replace(/['"\\`]/g, "");
    
    // Remove all spaces
    clean = clean.replace(/\s+/g, "");
    
    return clean;
};

const getNumberSignature = (str: string): string => {
    if (!str) return "";
    const matches = str.match(/\d+/g);
    return matches ? matches.join("-") : "";
};

export function BrushingReceiveDetails() {
    const { brushingReceivesList, brushingStockList, loading } = useSelector((state: RootState) => state.brushing);
    const { customerList, domesticCustomerList, internationalCustomerList } = useSelector((state: RootState) => state.customer as any);
    const { vendorList } = useSelector((state: RootState) => state.vendor);
    const { fabricMasterList, fabricMasterFullList } = useSelector((state: RootState) => state.fabricMaster as any);
    
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [receiveToDelete, setReceiveToDelete] = useState<any>(null);
    const [currentReceive, setCurrentReceive] = useState<any>(null);
    const [companyId, setCompanyId] = useState<number | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const bulkInputRef = useRef<HTMLInputElement | null>(null);
    const [selectedAttachmentContainer, setSelectedAttachmentContainer] = useState<string | null>(null);
    const [attachmentModalTitle, setAttachmentModalTitle] = useState<string>('');

    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const formatToYYYYMMDD = useCallback((val: any): string => {
        if (!val) return "";
        if (val instanceof Date) {
            const y = val.getFullYear();
            const m = String(val.getMonth() + 1).padStart(2, '0');
            const d = String(val.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        if (typeof val === 'number') {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000));
            const y = date.getUTCFullYear();
            const m = String(date.getUTCMonth() + 1).padStart(2, '0');
            const d = String(date.getUTCDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        let str = String(val).trim();
        if (!str) return "";
        str = str.replace(/[-/.]+/g, '-');
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            return str;
        }
        const parts = str.split('-');
        if (parts.length === 3) {
            let day = parts[0];
            let month = parts[1];
            let year = parts[2];
            if (day.length === 4) {
                const temp = day;
                day = year;
                year = temp;
            }
            const d = day.padStart(2, '0');
            const m = month.padStart(2, '0');
            let y = year;
            if (y.length === 2) {
                y = "20" + y;
            } else if (y.length === 3) {
                if (y === "206") {
                    y = "2026";
                } else if (y === "320") {
                    y = "2023";
                } else {
                    y = "20" + y.slice(-2);
                }
            } else if (y.length === 1) {
                y = "200" + y;
            }
            const numY = Number(y);
            const numM = Number(m);
            const numD = Number(d);
            if (!isNaN(numY) && !isNaN(numM) && numM >= 1 && numM <= 12 && !isNaN(numD) && numD >= 1 && numD <= 31) {
                return `${y}-${m}-${d}`;
            }
        }
        try {
            const parsed = new Date(str);
            if (!isNaN(parsed.getTime())) {
                const y = parsed.getFullYear();
                const m = String(parsed.getMonth() + 1).padStart(2, '0');
                const d = String(parsed.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            }
        } catch (e) {}
        return str;
    }, []);

    const findVendorId = useCallback((name: string) => {
        if (!name) return undefined;
        const norm = name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const getList = (listVal: any) => {
            if (Array.isArray(listVal)) return listVal;
            if (listVal?.data && Array.isArray(listVal.data.data)) return listVal.data.data;
            if (listVal?.data && Array.isArray(listVal.data)) return listVal.data;
            return [];
        };
        const list = getList(vendorList);
        let found = list.find((v: any) => v.vendorName && v.vendorName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === norm);
        if (found) return found.id;
        found = list.find((v: any) => v.vendorName && (v.vendorName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().includes(norm) || norm.includes(v.vendorName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())));
        return found ? found.id : undefined;
    }, [vendorList]);

    const findFabricMasterId = useCallback((construction: string) => {
        if (!construction) return undefined;
        const norm = construction.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const signatureTarget = getMatchableSignature(construction);
        
        const getList = (raw: any) => {
            return Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        };
        const list = [
            ...getList(fabricMasterList),
            ...getList(fabricMasterFullList)
        ];
        
        console.log(`[findFabricMasterId] Input: "${construction}", Signature target: "${signatureTarget}", List size: ${list.length}`);
        if (list.length > 0) {
            console.log(`[findFabricMasterId] First item fabricQuality: "${list[0]?.fabricQuality}", Signature: "${getMatchableSignature(list[0]?.fabricQuality)}"`);
        }
        
        // 1. Try matching using signature (for high-fidelity quality checks)
        let found = list.find((f: any) => {
            if (!f.fabricQuality) return false;
            const sig = getMatchableSignature(f.fabricQuality);
            const isMatch = sig && sig === signatureTarget;
            if (isMatch) {
                console.log(`[findFabricMasterId] Found match by signature: ID ${f.id} ("${f.fabricQuality}")`);
            }
            return isMatch;
        });
        if (found) return found.id;
        
        // 1.5. Try matching using numeric signature (extract all numbers)
        const numericTarget = getNumberSignature(construction);
        found = list.find((f: any) => {
            if (!f.fabricQuality) return false;
            const sig = getNumberSignature(f.fabricQuality);
            const isMatch = sig && sig === numericTarget;
            if (isMatch) {
                console.log(`[findFabricMasterId] Found match by numeric signature: ID ${f.id} ("${f.fabricQuality}")`);
            }
            return isMatch;
        });
        if (found) return found.id;
        
        // 2. Try matching code or quality exact normalized match
        found = list.find((f: any) => {
            const fullLabel = `${f.fabricCode || ""} - ${f.fabricQuality || ""}`;
            const cleanFull = fullLabel.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            const cleanQuality = f.fabricQuality ? f.fabricQuality.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() : "";
            const cleanCode = f.fabricCode ? f.fabricCode.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() : "";
            const isMatch = cleanFull === norm || cleanQuality === norm || cleanCode === norm;
            if (isMatch) {
                console.log(`[findFabricMasterId] Found match by exact normalized: ID ${f.id} ("${fullLabel}")`);
            }
            return isMatch;
        });
        if (found) return found.id;
        
        // 3. Try fallback fuzzy substring contains
        found = list.find((f: any) => {
            const fullLabel = `${f.fabricCode || ""} - ${f.fabricQuality || ""}`;
            const cleanLabel = fullLabel.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            const cleanQuality = f.fabricQuality ? f.fabricQuality.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() : "";
            const cleanCode = f.fabricCode ? f.fabricCode.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() : "";
            const isMatch = cleanLabel.includes(norm) || norm.includes(cleanLabel) || 
                            cleanQuality.includes(norm) || norm.includes(cleanQuality) ||
                            cleanCode.includes(norm) || norm.includes(cleanCode);
            if (isMatch) {
                console.log(`[findFabricMasterId] Found match by fuzzy substring: ID ${f.id} ("${fullLabel}")`);
            }
            return isMatch;
        });
        
        if (!found) {
            console.log(`[findFabricMasterId] No match found for "${construction}"`);
        }
        return found ? found.id : undefined;
    }, [fabricMasterList, fabricMasterFullList]);

    
    const fabricMap = useMemo(() => {
        const getList = (raw: any) => {
            return Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        };
        const list = [
            ...getList(fabricMasterList),
            ...getList(fabricMasterFullList)
        ];
        return list.reduce((acc: Record<string, string>, f: any) => {
            if (f && f.id) {
                acc[String(f.id)] = `${f.fabricCode} - ${f.fabricQuality}`;
            }
            return acc;
        }, {});
    }, [fabricMasterList, fabricMasterFullList]);
    
    const handleBulkImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsImporting(true);
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) {
                toast.error("The Excel sheet is empty.");
                setIsImporting(false);
                event.target.value = "";
                return;
            }

            const aoa = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });
            if (!Array.isArray(aoa) || aoa.length === 0) {
                toast.error("No data rows found in the uploaded file.");
                setIsImporting(false);
                event.target.value = "";
                return;
            }

            const keysToMatch = {
                pieceNo: ['pieceno', 'rollno', 'rollnumber', 'piecenumber', 'piece', 'roll'],
                greigeMeters: ['greigeqty', 'greigemeters', 'meters', 'mtr', 'qty', 'quantity', 'length', 'piecemeter', 'totalmtr', 'piecelength', 'recivingmtr', 'receivingmtr'],
                greigeWeight: ['greigewt', 'greigeweight', 'netwt', 'netweight', 'weight', 'wt', 'kg'],
                greigeGrossWt: ['grosswt', 'grossweight', 'gross', 'grwt'],
                passMtr: ['passmtr', 'pass_mtr', 'passqty', 'passmeters'],
                status: ['brushingstatus', 'status', 'rollstatus', 'processstatus', 'stage'],
                partyName: ['partyname', 'party', 'vendor', 'vendorname', 'weaver', 'weavername'],
                invoiceNo: ['hoinvoiceno', 'invoiceno', 'invoice', 'refinvoiceno', 'invoicenumber'],
                construction: ['construction', 'quality', 'fabric', 'fabricconstruction', 'design'],
                weave: ['weave', 'fabricweave', 'weavetype'],
                hfplRollNo: ['hfplrollno', 'hfplroll', 'hfplno'],
                hfplInvoiceNo: ['hfplinvoiceno', 'hfplinvoice', 'hfinvoiceno', 'hfinvoice'],
                tc: ['tc', 'tcno', 'tcnumber', 'testcertificate'],
                date: ['receivedate', 'date', 'inwarddate'],
                rollingDate: ['rollingdate', 'brushingdate', 'rolldate', 'brushdate'],
                dispatchDate: ['dispatchdate', 'dispatchdt', 'dpdate', 'dpdt', 'dispdate'],
                variation: ['variation', 'variations', 'variationmtr', 'variationmeters', 'excess', 'excessmtr']
            };

            // Search for the row containing header cells
            let headerRowIdx = -1;
            let pieceColIdx = -1;
            let greigeMetersColIdx = -1;

            for (let r = 0; r < Math.min(aoa.length, 30); r++) {
                const row = aoa[r];
                if (!Array.isArray(row)) continue;

                let hasPiece = -1;
                let hasMeters = -1;

                row.forEach((cellVal, c) => {
                    const cleanCell = String(cellVal).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (cleanCell) {
                        if (hasPiece === -1 && keysToMatch.pieceNo.some(pk => cleanCell === pk || cleanCell.includes(pk))) {
                            hasPiece = c;
                        }
                        if (hasMeters === -1 && keysToMatch.greigeMeters.some(pk => cleanCell === pk || cleanCell.includes(pk))) {
                            hasMeters = c;
                        }
                    }
                });

                if (hasPiece !== -1 && hasMeters !== -1) {
                    headerRowIdx = r;
                    pieceColIdx = hasPiece;
                    greigeMetersColIdx = hasMeters;
                    break;
                }
            }

            if (headerRowIdx === -1) {
                toast.error("Could not find Piece/Roll No or Greige Meters column in Excel.");
                setIsImporting(false);
                event.target.value = "";
                return;
            }

            const headerRow = aoa[headerRowIdx];
            const findColIndex = (possibleKeys: string[], excludeKeys: string[] = []) => {
                return headerRow.findIndex(cellVal => {
                    const cleanCell = String(cellVal).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (!cleanCell) return false;
                    if (excludeKeys.some(ek => cleanCell.includes(ek))) return false;
                    return possibleKeys.some(pk => cleanCell === pk || cleanCell.includes(pk));
                });
            };

            const greigeWeightColIdx = findColIndex(keysToMatch.greigeWeight);
            const greigeGrossWtColIdx = findColIndex(keysToMatch.greigeGrossWt);
            const passMtrColIdx = findColIndex(keysToMatch.passMtr);
            const constructionColIdx = (() => {
                // 1. Try finding by matching keys on the header (excluding status/date/etc. columns to prevent false matches)
                const excludeConstKeys = ['status', 'stage', 'state', 'date', 'invoice', 'party', 'roll', 'meter', 'weight', 'wt', 'glm', 'variation'];
                const headerIdx = headerRow.findIndex(cellVal => {
                    const cleanCell = String(cellVal).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (!cleanCell) return false;
                    const isConstKey = ['quality', 'fabricconstruction', 'design', 'construction', 'fabric'].some(pk => cleanCell === pk || cleanCell.includes(pk));
                    const isExcluded = excludeConstKeys.some(ek => cleanCell.includes(ek));
                    return isConstKey && !isExcluded;
                });
                if (headerIdx !== -1) return headerIdx;

                // 2. Fallback: scan first few data rows for construction patterns (e.g. "20 OE x 8 OE / 42 x (37*1) / 122")
                const dataRows = aoa.slice(headerRowIdx + 1);
                for (let c = 0; c < headerRow.length; c++) {
                    for (let r = 0; r < Math.min(dataRows.length, 10); r++) {
                        const cellVal = dataRows[r]?.[c];
                        if (cellVal) {
                            const strVal = String(cellVal).trim();
                            if (strVal.includes('/') && (strVal.includes('x') || strVal.includes('*')) && strVal.replace(/[^0-9]/g, '').length >= 3) {
                                return c;
                            }
                        }
                    }
                }
                return -1;
            })();
            const statusColIdx = (() => {
                let idx = findColIndex(keysToMatch.status);
                if (idx !== -1) return idx;
                const constIdx = findColIndex(['construction']);
                if (constIdx !== -1 && constIdx !== constructionColIdx) {
                    return constIdx;
                }
                return -1;
            })();
            const partyNameColIdx = findColIndex(keysToMatch.partyName);
            const invoiceNoColIdx = findColIndex(keysToMatch.invoiceNo, ['hfpl']);
            const weaveColIdx = findColIndex(keysToMatch.weave);
            const hfplRollNoColIdx = findColIndex(keysToMatch.hfplRollNo);
            const hfplInvoiceNoColIdx = findColIndex(keysToMatch.hfplInvoiceNo, ['hoinvoice', 'hoinvoiceno']);
            const tcColIdx = findColIndex(keysToMatch.tc);
            const dateColIdx = findColIndex(keysToMatch.date);
            const rollingDateColIdx = findColIndex(keysToMatch.rollingDate);
            const dispatchDateColIdx = findColIndex(keysToMatch.dispatchDate);
            const variationColIdx = findColIndex(keysToMatch.variation);

            const mappedRows: any[] = [];

            
            for (let r = headerRowIdx + 1; r < aoa.length; r++) {
                const row = aoa[r];
                if (!Array.isArray(row) || row.length === 0) continue;

                const rollNo = pieceColIdx !== -1 && row[pieceColIdx] !== undefined ? String(row[pieceColIdx]).trim() : "";
                if (!rollNo) continue;

                const greigeMeters = greigeMetersColIdx !== -1 && row[greigeMetersColIdx] !== undefined ? Number(row[greigeMetersColIdx]) || 0 : 0;
                if (greigeMeters === 0) continue;

                const greigeWeight = greigeWeightColIdx !== -1 && row[greigeWeightColIdx] !== undefined ? Number(row[greigeWeightColIdx]) || 0 : 0;
                const greigeGrossWt = greigeGrossWtColIdx !== -1 && row[greigeGrossWtColIdx] !== undefined ? Number(row[greigeGrossWtColIdx]) || 0 : 0;
                const passMtr = passMtrColIdx !== -1 && row[passMtrColIdx] !== undefined && row[passMtrColIdx] !== "" ? Number(row[passMtrColIdx]) || 0 : greigeMeters;

                const partyName = partyNameColIdx !== -1 && row[partyNameColIdx] !== undefined ? String(row[partyNameColIdx]).trim() : "";
                const invoiceNo = invoiceNoColIdx !== -1 && row[invoiceNoColIdx] !== undefined ? String(row[invoiceNoColIdx]).trim() : "";
                const construction = constructionColIdx !== -1 && row[constructionColIdx] !== undefined ? String(row[constructionColIdx]).trim() : "";
                const weave = weaveColIdx !== -1 && row[weaveColIdx] !== undefined ? String(row[weaveColIdx]).trim() : "";
                const hfplRollNo = hfplRollNoColIdx !== -1 && row[hfplRollNoColIdx] !== undefined ? String(row[hfplRollNoColIdx]).trim() : "";
                const hfplInvoiceNo = hfplInvoiceNoColIdx !== -1 && row[hfplInvoiceNoColIdx] !== undefined ? String(row[hfplInvoiceNoColIdx]).trim() : "";
                const tc = tcColIdx !== -1 && row[tcColIdx] !== undefined ? String(row[tcColIdx]).trim() : "";
                
                const rawDateVal = dateColIdx !== -1 && row[dateColIdx] !== undefined ? row[dateColIdx] : null;
                const receiveDate = rawDateVal ? formatToYYYYMMDD(rawDateVal) : new Date().toISOString().split("T")[0];

                const statusStr = statusColIdx !== -1 && row[statusColIdx] !== undefined ? String(row[statusColIdx]).trim().toUpperCase() : "";

                let brushingStatus = "PENDING";
                let unwindStatus = "PENDING";
                let isUnwound = 0;
                let isBrushed = 0;
                let isDispatched = 0;
                let isInvoice = 0;

                if (statusStr.includes("DP") || statusStr.includes("DISPATCH")) {
                    brushingStatus = "DISPATCHED";
                    unwindStatus = "ACCEPTED";
                    isUnwound = 1;
                    isBrushed = 1;
                    isDispatched = 1;
                    isInvoice = 1;
                } else if (statusStr.includes("RD") || statusStr.includes("READY")) {
                    brushingStatus = "READY_FOR_DISPATCH";
                    unwindStatus = "ACCEPTED";
                    isUnwound = 1;
                    isBrushed = 1;
                } else if (statusStr.includes("UB") || statusStr.includes("UNDER") || statusStr.includes("ROLL")) {
                    brushingStatus = "PENDING";
                    unwindStatus = "ACCEPTED";
                    isUnwound = 1;
                }

                const rawRollingDateVal = rollingDateColIdx !== -1 && row[rollingDateColIdx] !== undefined ? row[rollingDateColIdx] : null;
                const rollingDate = rawRollingDateVal ? formatToYYYYMMDD(rawRollingDateVal) : (isBrushed ? receiveDate : undefined);

                const rawDispatchDateVal = dispatchDateColIdx !== -1 && row[dispatchDateColIdx] !== undefined ? row[dispatchDateColIdx] : null;
                const dispatchDate = rawDispatchDateVal
                    ? formatToYYYYMMDD(rawDispatchDateVal)
                    : (isDispatched ? receiveDate : undefined);

                const rawVariationVal = variationColIdx !== -1 && row[variationColIdx] !== undefined && row[variationColIdx] !== "" ? Number(row[variationColIdx]) : undefined;
                const variation = rawVariationVal !== undefined && !isNaN(rawVariationVal) ? rawVariationVal : (passMtr - greigeMeters);

                const vendorId = findVendorId(partyName);
                const fabricMasterId = findFabricMasterId(construction);

                mappedRows.push({
                    rollNo,
                    greigeMeters,
                    greigeWeight,
                    greigeGrossWt,
                    passMtr,
                    variation,
                    partyName,
                    invoiceNo,
                    hfplInvoiceNo,
                    construction,
                    weave,
                    hfplRollNo,
                    tc,
                    receiveDate,
                    rollingDate,
                    dispatchDate,
                    brushingStatus,
                    unwindStatus,
                    isUnwound,
                    isBrushed,
                    isDispatched,
                    isInvoice,
                    vendorId,
                    fabricMasterId
                });
            }

            const groups: Record<string, typeof mappedRows> = {};
            mappedRows.forEach(row => {
                const groupKey = `${row.receiveDate}_${row.vendorId || row.partyName}_${row.fabricMasterId || row.construction}`;
                if (!groups[groupKey]) {
                    groups[groupKey] = [];
                }
                groups[groupKey].push(row);
            });

            const groupKeys = Object.keys(groups);
            if (groupKeys.length === 0) {
                toast.error("No valid entries found after parsing.");
                setIsImporting(false);
                event.target.value = "";
                return;
            }

            toast.info(`Parsed ${mappedRows.length} rolls into ${groupKeys.length} receive group(s). Starting bulk upload...`);

            let successCount = 0;
            for (let i = 0; i < groupKeys.length; i++) {
                const key = groupKeys[i];
                const groupRows = groups[key];
                const sampleRow = groupRows[0];

                const dateStr = sampleRow.receiveDate.replace(/-/g, "");
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                const challanNo = `BR-${dateStr}-${randomSuffix}`;

                const payload = {
                    receiveChallanNo: challanNo,
                    receiveDate: sampleRow.receiveDate,
                    remarks: "Bulk Excel Upload",
                    companyId: companyId,
                    orderType: "JOBWORK",
                    buyerId: 4,
                    weaverId: sampleRow.vendorId,
                    fabricMasterId: sampleRow.fabricMasterId,
                    refInvoiceNo: sampleRow.invoiceNo,
                    details: groupRows.map(r => ({
                        pieceNumber: r.rollNo,
                        greigeMeters: r.greigeMeters,
                        greigeWeight: r.greigeWeight,
                        greigeGrossWt: r.greigeGrossWt,
                        brushedMeters: r.brushingStatus !== "PENDING" ? r.passMtr : 0,
                        brushedWeight: r.brushingStatus !== "PENDING" ? r.greigeWeight : 0,
                        brushedGrossWt: r.brushingStatus !== "PENDING" ? r.greigeGrossWt : 0,
                        shrinkagePercentage: 0,
                        weightLossPercentage: 0,
                        isBrushed: r.isBrushed,
                        isUnwound: r.isUnwound,
                        costPerUnit: 0,
                        totalAmount: 0,
                        tc: r.tc,
                        weave: r.weave,
                        date: r.receiveDate,
                        partyName: r.partyName,
                        invoiceNo: r.invoiceNo,
                        construction: r.fabricMasterId ? (fabricMap[r.fabricMasterId] || r.construction) : r.construction,
                        passMtr: r.passMtr,
                        variation: r.variation,
                        unwoundMeters: r.isUnwound ? r.greigeMeters : 0,
                        unwoundWeight: r.isUnwound ? r.greigeWeight : 0,
                        unwoundGrossWt: r.isUnwound ? r.greigeGrossWt : 0,
                        unwindStatus: r.unwindStatus,
                        brushingStatus: r.brushingStatus,
                        brushingMachineNo: r.isBrushed ? "AUTO" : "",
                        hfplRollNo: r.hfplRollNo || undefined,
                        hfplInvoiceNo: r.hfplInvoiceNo || undefined,
                        isDispatched: r.isDispatched,
                        isInvoice: r.isInvoice,
                        vendorId: r.vendorId,
                        fabricMasterId: r.fabricMasterId,
                        unwindDate: r.isUnwound ? r.receiveDate : undefined,
                        unwindedDate: r.isUnwound ? r.receiveDate : undefined,
                        brushingDate: r.isBrushed ? r.rollingDate : undefined,
                        rollingDate: r.isBrushed ? r.rollingDate : undefined,
                        dispatchDate: r.isDispatched ? r.dispatchDate : undefined
                    }))
                };

                try {
                    await dispatch(createBrushingReceive(payload)).unwrap();
                    successCount++;
                } catch (err: any) {
                    console.error(`Failed to upload group ${i+1}:`, err);
                    toast.error(`Group ${i+1}/${groupKeys.length} failed: ${err?.message || err}`);
                }
            }

            toast.success(`Bulk upload completed! Successfully created ${successCount} receive challans.`);
            if (companyId) {
                dispatch(getAllBrushingReceivesByCompany(companyId));
                dispatch(getBrushingStock({ companyId }));
            }
        } catch (error) {
            console.error("Bulk upload failed:", error);
            toast.error("Failed to parse or save the Excel file.");
        } finally {
            setIsImporting(false);
            if (bulkInputRef.current) bulkInputRef.current.value = "";
        }
    }, [companyId, findVendorId, findFabricMasterId, formatToYYYYMMDD, fabricMap, dispatch]);

    useEffect(() => {
        const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
        if (storedCompanyId) {
            const numericCompanyId = Number(storedCompanyId);
            setCompanyId(numericCompanyId);
        }
        dispatch(getAllCustomers({ fetchAll: true } as any));
        dispatch(getAllVendors({ fetchAll: true } as any));
        dispatch(getAllFabricMasters({ fetchAll: true } as any));
        dispatch(getAllFabricMastersForDropdown() as any);
    }, [dispatch]);

    useEffect(() => {
        if (!companyId) return;
        dispatch(getAllBrushingReceivesByCompany(companyId));
        dispatch(getBrushingStock({ companyId }));
    }, [dispatch, companyId]);

    const buyerMap = useMemo(() => {
        const getList = (listVal: any) => {
            if (Array.isArray(listVal)) return listVal;
            if (listVal?.data && Array.isArray(listVal.data.data)) return listVal.data.data;
            if (listVal?.data && Array.isArray(listVal.data)) return listVal.data;
            return [];
        };

        const list = [
            ...getList(customerList),
            ...getList(domesticCustomerList),
            ...getList(internationalCustomerList)
        ];

        return list.reduce((acc: Record<number, string>, c: any) => {
            if (c && c.id) {
                acc[c.id] = c.customerName ?? c.name ?? "";
            }
            return acc;
        }, {});
    }, [customerList, domesticCustomerList, internationalCustomerList]);

    const vendorMap = useMemo(() => {
        const getList = (listVal: any) => {
            if (Array.isArray(listVal)) return listVal;
            if (listVal?.data && Array.isArray(listVal.data.data)) return listVal.data.data;
            if (listVal?.data && Array.isArray(listVal.data)) return listVal.data;
            return [];
        };
        const list = getList(vendorList);
        return list.reduce((acc: Record<string, string>, v: any) => {
            if (v && v.id) {
                acc[String(v.id)] = v.vendorName ?? v.name ?? "";
            }
            return acc;
        }, {});
    }, [vendorList]);


    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());

    const processedList = useMemo(() => {
        const list = Array.isArray(brushingReceivesList) ? brushingReceivesList : [];
        const sortedList = [...list].sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
        return sortedList.map((rec: any, index: number) => {
            const details = Array.isArray(rec.details) ? rec.details : [];
            const totalGreigeMeters = details.reduce((sum: number, d: any) => sum + (Number(d.greigeMeters) || 0), 0);
            return {
                ...rec,
                serialNo: index + 1,
                pieceCount: details.length,
                totalGreigeMeters,
                invoiceNo: details[0]?.invoiceNo || '-',
            };
        });
    }, [brushingReceivesList]);

    const containerNames = useMemo(() => {
        return (processedList || []).map((rec: any) => `brushing_receive_${rec.id}`);
    }, [processedList]);

    const { counts: fileCounts, updateCount: updateFileCount } = useFileCounts(containerNames);

    const handleOpenAttachmentModal = useCallback((receive: any) => {
        setSelectedAttachmentContainer(`brushing_receive_${receive.id}`);
        setAttachmentModalTitle(`Brushing Receive #${receive.receiveChallanNo || receive.id} Files`);
    }, []);


    const overallTotals = useMemo(() => {
        return processedList.reduce((acc, row) => {
            acc.totalMeters += Number(row.totalGreigeMeters) || 0;
            acc.totalRolls += Number(row.pieceCount) || 0;
            return acc;
        }, { totalMeters: 0, totalRolls: 0 });
    }, [processedList]);

    const brushingStockTotals = useMemo(() => {
        const list = Array.isArray(brushingStockList) ? brushingStockList : [];
        return list.reduce((acc, item: any) => {
            acc.totalStock += 1;
            acc.receiving += Number(item.receivingMtr || 0);
            acc.pass += Number(item.passMtr || 0);
            return acc;
        }, { totalStock: 0, receiving: 0, pass: 0 });
    }, [brushingStockList]);

    const selectedTotals = useMemo(() => {
        const selectedRows = processedList.filter(row => selectedRowIds.has(row.id));
        return selectedRows.reduce((acc, row) => {
            acc.totalMeters += Number(row.totalGreigeMeters) || 0;
            acc.totalRolls += Number(row.pieceCount) || 0;
            return acc;
        }, { totalMeters: 0, totalRolls: 0 });
    }, [processedList, selectedRowIds]);

    const isAllSelected = useMemo(() => {
        const allPageIds = processedList.map((item: any) => item.id);
        return allPageIds.length > 0 && allPageIds.every(id => selectedRowIds.has(id));
    }, [processedList, selectedRowIds]);

    const isSomeSelected = useMemo(() => {
        const allPageIds = processedList.map((item: any) => item.id);
        return allPageIds.some(id => selectedRowIds.has(id)) && !isAllSelected;
    }, [processedList, selectedRowIds, isAllSelected]);

    const columns = useMemo(
        () => [
            ...(isSelectionMode ? [
                {
                    id: 'selection',
                    width: 40,
                    disableFilters: true,
                    Header: (
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={(el) => {
                                if (el) {
                                    el.indeterminate = isSomeSelected;
                                }
                            }}
                            onChange={(e) => {
                                const newSelected = new Set<number>();
                                if (e.target.checked) {
                                    processedList.forEach((item: any) => newSelected.add(item.id));
                                }
                                setSelectedRowIds(newSelected);
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                    ),
                    Cell: ({ row }: { row: any }) => (
                        <input
                            type="checkbox"
                            checked={selectedRowIds.has(row.original.id)}
                            onChange={(e) => {
                                const newSelected = new Set(selectedRowIds);
                                if (e.target.checked) {
                                    newSelected.add(row.original.id);
                                } else {
                                    newSelected.delete(row.original.id);
                                }
                                setSelectedRowIds(newSelected);
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                    )
                }
            ] : []),
            {
                Header: 'S.No',
                accessor: 'serialNo',
                width: 50,
                disableFilters: true,
            },
            {
                Header: 'Receive Date',
                accessor: 'receiveDate',
                Cell: ({ value }: { value: string }) => formatDate(value),
                Filter: DateRangeFilter,
                filter: (rows: any[], columnIds: string[], filterValue: any) => {
                    if (!filterValue || (!filterValue.from && !filterValue.to)) return rows;
                    return rows.filter(row => {
                        const dateStr = row.values[columnIds[0]];
                        if (!dateStr) return false;
                        const date = new Date(dateStr);
                        if (filterValue.from) {
                            const fromDate = new Date(filterValue.from);
                            if (date < fromDate) return false;
                        }
                        if (filterValue.to) {
                            const toDate = new Date(filterValue.to);
                            if (date > toDate) return false;
                        }
                        return true;
                    });
                }
            },
            {
                Header: 'Inward No',
                accessor: 'receiveChallanNo'
            },
            {
                Header: 'Order Type',
                accessor: 'orderType',
                Cell: ({ value }: { value: string }) => (
                    <span className="font-semibold text-slate-700">
                        {value === 'INHOUSE' ? 'Internal' : 'External'}
                    </span>
                )
            },
            {
                Header: 'Party Invoice No',
                accessor: 'invoiceNo'
            },
            {
                Header: 'Buyer',
                accessor: 'buyerId',
                Cell: ({ value }: { value: number }) => buyerMap[value] || 'Internal Buyer'
            },
            {
                Header: 'Party Name',
                accessor: 'weaverId',
                Cell: ({ row, value }: { row: any; value: number }) => {
                    const weaverId = value || row.original.details?.[0]?.vendorId;
                    return weaverId ? (vendorMap[String(weaverId)] || '-') : '-';
                }
            },
            {
                Header: 'Fabric Construction',
                accessor: 'fabricMasterId',
                Cell: ({ row, value }: { row: any; value: any }) => {
                    if (typeof value === 'string' && value.includes(' - ')) {
                        return value;
                    }
                    const fabricId = value || row.original.details?.[0]?.fabricMasterId;
                    return fabricId ? (fabricMap[String(fabricId)] || '-') : '-';
                }
            },
            // {
            //     Header: 'Status',
            //     accessor: 'status',
            //     Cell: ({ row }: { row: any }) => {
            //         const details = Array.isArray(row.original.details) ? row.original.details : [];
            //         const totalRolls = details.length;
            //         const unwoundCount = details.filter((d: any) => Number(d.isUnwound) === 1).length;
            //         const brushedCount = details.filter((d: any) => Number(d.isBrushed) === 1).length;
                    
            //         let badgeText = 'PENDING';
            //         let badgeClass = 'bg-yellow-100 text-yellow-800 border border-yellow-200';
                    
            //         if (totalRolls > 0 && brushedCount === totalRolls) {
            //             badgeText = 'RD';
            //             badgeClass = 'bg-green-100 text-green-800 border border-green-200';
            //         } else if (unwoundCount > 0 || brushedCount > 0) {
            //             badgeText = 'UB';
            //             badgeClass = 'bg-blue-100 text-blue-800 border border-blue-200';
            //         }
                    
            //         return (
            //             <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${badgeClass}`}>
            //                 {badgeText}
            //             </span>
            //         );
            //     }
            // },
            // {
            //     Header: 'Is Rejected',
            //     accessor: 'isRejected',
            //     Cell: ({ value }: { value: number }) => (
            //         <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
            //             value === 1 
            //                 ? 'bg-rose-100 text-rose-800 border border-rose-200' 
            //                 : 'bg-slate-100 text-slate-700'
            //         }`}>
            //             {value === 1 ? 'Yes' : 'No'}
            //         </span>
            //     )
            // },
            {
                Header: 'Total Received Mtr',
                accessor: 'totalGreigeMeters',
                Cell: ({ value }: { value: number }) => value != null && value > 0 ? `${Number(value).toFixed(2)} m` : '-'
            },
            {
                Header: 'No. of Pieces',
                accessor: 'pieceCount',
                width: 120,
                disableFilters: true,
            },
            {
                Header: 'Files',
                accessor: 'id',
                disableFilters: true,
                Cell: (props: any) => {
                    const { row } = props;
                    const containerName = `brushing_receive_${row.original.id}`;
                    const count = fileCounts[containerName] || 0;
                    return count > 0 ? (
                        <button
                            onClick={() => handleOpenAttachmentModal(row.original)}
                            className="text-blue-600 underline hover:text-blue-800 text-sm font-medium cursor-pointer"
                        >
                            View Files ({count})
                        </button>
                    ) : (
                        <button
                            onClick={() => handleOpenAttachmentModal(row.original)}
                            className="text-blue-600 underline hover:text-blue-800 text-sm font-medium cursor-pointer"
                        >
                            Upload
                        </button>
                    );
                },
            }
        ],
        [buyerMap, vendorMap, fabricMap, isSelectionMode, selectedRowIds, isAllSelected, isSomeSelected, processedList, fileCounts, handleOpenAttachmentModal]
    );

    const handleView = (receive: any) => {
        setCurrentReceive(receive);
        setIsViewModalOpen(true);
    };

    const handleEdit = (receive: any) => {
        navigate(`/transaction/brushing-receive?id=${receive.id}`);
    };

    const handleDelete = (receive: any) => {
        setReceiveToDelete(receive);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (receiveToDelete) {
            dispatch(deleteBrushingReceive(receiveToDelete.id));
        }
        setIsDeleteModalOpen(false);
        setReceiveToDelete(null);
    };

    const handleAdd = () => {
        dispatch(resetCurrentReceive());
        navigate("/transaction/brushing-receive");
    };

    return (
        <div className="p-6 pt-16">
            {/* Highlight Banner for Physical Opening Stock */}
            
            <DataTable
                columns={columns}
                data={processedList}
                title="Brushing Receive Details"
                onAdd={handleAdd}
                showActions={true}
                showColumnFilters={true}
                filterPlaceholder="Search Brushing Receive..."
                loading={loading}
                virtualScroll={true}
                isShowPagination={false}
                headerActions={
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <input
                            type="file"
                            ref={bulkInputRef}
                            onChange={handleBulkImport}
                            accept=".xlsx, .xls, .csv"
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => bulkInputRef.current?.click()}
                            disabled={isImporting}
                            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-sm border border-transparent"
                        >
                            <Upload className="h-3.5 w-3.5" />
                            {isImporting ? "Importing..." : "Bulk Import Excel"}
                        </button>
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-semibold rounded-lg shadow-sm">
                            <span className="text-slate-600 font-medium">Total: <strong className="text-slate-800 font-bold">{overallTotals.totalMeters.toFixed(2)} m</strong></span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-600 font-medium">Rolls: <strong className="text-slate-800 font-bold">{overallTotals.totalRolls}</strong></span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                setSelectedRowIds(new Set());
                            }}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all shadow-sm border ${
                                isSelectionMode 
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                    : 'bg-blue-600 text-white border-transparent hover:bg-blue-700'
                            }`}
                        >
                            {isSelectionMode ? 'Disable Check Total' : 'Check Total Mtr'}
                        </button>
                        {isSelectionMode && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-semibold">
                                {selectedRowIds.size === 0 ? (
                                    <span className="text-slate-400">Select rows...</span>
                                ) : (
                                    <>
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                                        </span>
                                        <span>
                                            Sum: <strong>{selectedTotals.totalMeters.toFixed(2)} m</strong> | <strong>{selectedTotals.totalRolls} Rolls</strong>
                                        </span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                }
                renderActions={(row) => (
                    <div className="flex items-center justify-center gap-1.5">
                        <button
                            onClick={() => handleView(row)}
                            className="rounded-lg border border-blue-100 bg-blue-50/60 p-2 text-blue-600 transition hover:border-blue-200"
                            title="View Details"
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => handleEdit(row)}
                            className="rounded-lg border border-amber-100 bg-amber-50/60 p-2 text-amber-600 transition hover:border-amber-200"
                            title="Edit"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => handleDelete(row)}
                            className="rounded-lg border border-rose-100 bg-rose-50/70 p-2 text-rose-600 transition hover:border-rose-200"
                            title="Delete"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                )}
            />

            {/* View Details Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`Brushing Receive Details: ${currentReceive?.receiveChallanNo || ''}`}
            >
                {currentReceive && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 border-b pb-4">
                            <div>
                                <span className="text-sm text-slate-500 font-medium">Receive Date:</span>
                                <p className="font-semibold text-slate-800">{formatDate(currentReceive.receiveDate)}</p>
                            </div>
                            <div>
                                <span className="text-sm text-slate-500 font-medium">Order Type:</span>
                                <p className="font-semibold text-slate-800">{currentReceive.orderType === 'INHOUSE' ? 'Internal' : 'External'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-slate-500 font-medium">Buyer:</span>
                                <p className="font-semibold text-slate-800">{buyerMap[currentReceive.buyerId] || 'Internal Buyer'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-slate-500 font-medium">Status:</span>
                                <p className="font-semibold text-slate-800 uppercase">
                                    {(() => {
                                        const details = Array.isArray(currentReceive.details) ? currentReceive.details : [];
                                        const totalRolls = details.length;
                                        const unwoundCount = details.filter((d: any) => Number(d.isUnwound) === 1).length;
                                        const brushedCount = details.filter((d: any) => Number(d.isBrushed) === 1).length;
                                        if (totalRolls > 0 && brushedCount === totalRolls) {
                                            return 'RD (Ready For Dispatch)';
                                        } else if (unwoundCount > 0 || brushedCount > 0) {
                                            return 'UB (Under Brushing)';
                                        }
                                        return 'PENDING';
                                    })()}
                                </p>
                            </div>
                            {currentReceive.brushingCompletedDate && (
                                <div>
                                    <span className="text-sm text-slate-500 font-medium">Completed Date:</span>
                                    <p className="font-semibold text-slate-800">{formatDate(currentReceive.brushingCompletedDate)}</p>
                                </div>
                            )}
                            <div>
                                <span className="text-sm text-slate-500 font-medium">Pass Mtr:</span>
                                <p className="font-semibold text-slate-800">{currentReceive.passMtr ? `${Number(currentReceive.passMtr).toFixed(2)} m` : '-'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-slate-500 font-medium">Remarks:</span>
                                <p className="font-semibold text-slate-800">{currentReceive.remarks || '-'}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Received Pieces</h3>
                            <div className="overflow-x-auto max-h-96">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">S.No</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Party Name</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Invoice No</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">TC</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Construction</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Weave</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Roll No</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Is Rejected</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Reciving Mtr</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Net Wt</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">GLM</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Gross Wt</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Brushed Qty (Mtr)</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Brushed Wt (Kg)</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Brushed Gross Wt (Kg)</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Shrinkage %</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Variation (Mtr)</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Weight Loss %</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">GLM (Brushed)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {Array.isArray(currentReceive.details) ? (
                                            currentIssueDetailsMap(currentReceive.details)
                                        ) : (
                                            <tr>
                                                <td colSpan={20} className="px-3 py-4 text-sm text-center text-slate-500">No pieces found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <Button
                                onClick={() => setIsViewModalOpen(false)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl px-5 py-2"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setReceiveToDelete(null);
                }}
                title="Delete Confirmation"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Are you sure you want to delete this brushing receive record?
                    </p>
                    {receiveToDelete && (
                        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-xs space-y-1.5">
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Inward No:</span>
                                <span className="font-bold text-slate-800">{receiveToDelete.receiveChallanNo}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Receive Date:</span>
                                <span className="font-bold text-slate-800">{formatDate(receiveToDelete.receiveDate)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Buyer:</span>
                                <span className="font-bold text-slate-800">{buyerMap[receiveToDelete.buyerId] || 'Internal Buyer'}</span>
                            </div>
                        </div>
                    )}
                    <p className="text-xs text-rose-600 font-medium">
                        * This action is permanent and cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 pt-3 border-t">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setReceiveToDelete(null);
                            }}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 rounded-xl px-4 py-2 text-sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmDelete}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-5 py-2 text-sm font-semibold shadow-sm"
                        >
                            Delete
                        </Button>
                    </div>
                </div>
                </Modal>
            {selectedAttachmentContainer && (
                <DocumentAttachmentModal
                    isOpen={Boolean(selectedAttachmentContainer)}
                    onClose={() => setSelectedAttachmentContainer(null)}
                    containerName={selectedAttachmentContainer}
                    title={attachmentModalTitle}
                    onFilesUpdated={(newCount) => updateFileCount(selectedAttachmentContainer, newCount)}
                />
            )}
         
        </div>
    );

    function currentIssueDetailsMap(details: any[]) {
        return details.map((detail: any, i: number) => {
            const variation = (Number(detail.brushedMeters) || 0) - (Number(detail.greigeMeters) || 0);
            const brushedGlm = Number(detail.brushedMeters) > 0 ? ((Number(detail.brushedWeight) || 0) / Number(detail.brushedMeters)) : 0;
            return (
                <tr key={detail.id || i}>
                    <td className="px-3 py-2 text-sm text-slate-900">{i + 1}</td>
                    <td className="px-3 py-2 text-sm text-slate-900">{detail.date || '-'}</td>
                    <td className="px-3 py-2 text-sm text-slate-900">{detail.partyName || '-'}</td>
                    <td className="px-3 py-2 text-sm text-slate-900">{detail.invoiceNo || '-'}</td>
                    <td className="px-3 py-2 text-sm text-slate-900">{detail.tc || '-'}</td>
                    <td className="px-3 py-2 text-sm text-slate-900">{detail.construction || '-'}</td>
                    <td className="px-3 py-2 text-sm text-slate-900">{detail.weave || '-'}</td>
                    <td className="px-3 py-2 text-sm text-slate-900 font-medium">{detail.pieceNumber}</td>
                    <td className="px-3 py-2 text-sm text-slate-900">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            detail.isRejected === 1 
                                ? 'bg-rose-100 text-rose-800' 
                                : 'bg-slate-100 text-slate-800'
                        }`}>
                            {detail.isRejected === 1 ? 'Yes' : 'No'}
                        </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-slate-500">{Number(detail.greigeMeters).toFixed(2)}</td>
                    <td className="px-3 py-2 text-sm text-right text-slate-500">{Number(detail.greigeWeight).toFixed(3)}</td>
                    <td className="px-3 py-2 text-sm text-right text-slate-900 font-medium">{Number(detail.glm || 0).toFixed(3)}</td>
                    <td className="px-3 py-2 text-sm text-right text-slate-500">{Number(detail.greigeGrossWt || 0).toFixed(3)}</td>
                    <td className="px-3 py-2 text-sm text-right text-slate-500">{Number(detail.brushedMeters).toFixed(2)}</td>
                    <td className="px-3 py-2 text-sm text-right text-slate-500">{Number(detail.brushedWeight).toFixed(3)}</td>
                    <td className="px-3 py-2 text-sm text-right text-slate-500">{Number(detail.brushedGrossWt || 0).toFixed(3)}</td>
                    <td className="px-3 py-2 text-sm text-right">
                        <span className={`font-semibold ${Number(detail.shrinkagePercentage) > 0 ? 'text-green-600' : Number(detail.shrinkagePercentage) < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                            {detail.shrinkagePercentage}%
                        </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-right font-medium">
                        <span className={`font-semibold ${variation > 0 ? 'text-green-600' : variation < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                            {variation > 0 ? `+${variation.toFixed(2)}` : variation.toFixed(2)} m
                        </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-right">
                        <span className={`font-semibold ${Number(detail.weightLossPercentage) > 0 ? 'text-green-600' : Number(detail.weightLossPercentage) < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                            {detail.weightLossPercentage}%
                        </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-900 text-right font-medium">
                        {brushedGlm.toFixed(3)}
                    </td>
                </tr>
            );
        });
    }
}
