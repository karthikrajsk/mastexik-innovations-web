import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AppDispatch, RootState } from "@/state/store";
import { createBrushingReceive, getBrushingReceiveById, resetCurrentReceive, updateBrushingReceive, getAllBrushingReceivesByCompany } from "@/state/brushingSlice";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommonSearchableSelect, CommonSearchableSelectOption } from "@/components/ui/CommonSearchableSelect";
import { ArrowLeft, Save, Upload, AlertCircle, FileDown, Trash2, Plus, Download, ListChecks, SkipForward } from "lucide-react";
import { toast } from "react-toastify";
import { generateExcelTemplate, readExcelFile, exportToExcel } from "@/lib/utils";

interface FormValues {
    receiveDate: string;
    receiveChallanNo: string;
    orderType: "INHOUSE" | "JOBWORK";
    buyerId: string;
    fabricMasterId: string;
    remarks: string;
    weaverId: string;
    invoiceNo: string;
    tc: string;
    refPoNo: string;
}

interface BrushingReceiveDetailRow {
    pieceEntryId: number;
    pieceNumber: string;
    greigeMeters: number;
    greigeWeight: number;
    greigeGrossWt: number;
    brushedMeters: string;
    brushedWeight: string;
    brushedGrossWt: string;
    shrinkagePercentage: number;
    weightLossPercentage: number;
    isBrushed?: number;
    isUnwound?: number;
    costPerUnit: string;
    totalAmount: string;
    date: string;
    partyName: string;
    invoiceNo: string;
    tc: string;
    construction: string;
    weave: string;
    glm: number;
    vendorId?: number;
    fabricMasterId?: number;
    passMtr?: number | string | null;
    unwindStatus?: string;
    brushingStatus?: string;
    brushingMachineNo?: string;
    unwindRemarks?: string;
    unwoundMeters?: number;
    unwoundWeight?: number;
    unwoundGrossWt?: number;
    isRejected?: number;
    hfplRollNo?: string;
    brushingDate?: string;
}

const isSamePieceNumber = (num1: string, num2: string) => {
    if (!num1 || !num2) return false;
    const clean = (s: string) => s.trim().toLowerCase().replace(/_br$/, '');
    return clean(num1) === clean(num2);
};

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

const formatToYYYYMMDD = (val: any): string => {
    if (!val) return "";
    
    // If it's a JS Date object
    if (val instanceof Date) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    
    // If it's a number (Excel date serial)
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
    
    // If it's in YYYY-MM-DD format already
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
    }
    
    // If it's in DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY format
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
    } catch (e) {
        // ignore
    }
    
    return str;
};

export function BrushingReceive() {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const location = useLocation();

    const { loading, currentReceive, brushingReceivesList } = useSelector((state: RootState) => state.brushing);
    const { vendorList } = useSelector((state: RootState) => state.vendor);
    const { customerList } = useSelector((state: RootState) => state.customer);
    const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster as any);
    const { subCategoryList } = useSelector((state: RootState) => state.subCategory);

    const [pieces, setPieces] = useState<BrushingReceiveDetailRow[]>([]);
    const [receivedSearch, setReceivedSearch] = useState('');
    const [companyId, setCompanyId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const editId = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get("id");
        return id ? Number(id) : null;
    }, [location.search]);

    const { register, handleSubmit, watch, setValue } = useForm<FormValues>({
        defaultValues: {
            receiveDate: new Date().toISOString().split("T")[0],
            receiveChallanNo: "",
            orderType: "JOBWORK",
            buyerId: "",
            fabricMasterId: "",
            remarks: "",
            weaverId: "",
            invoiceNo: "",
            tc: "",
            refPoNo: ""
        }
    });

    const orderType = watch("orderType");

    const rollNoExistsInDb = (
        rollNo: string,
        currentWeaverId?: number,
        currentInvoiceNo?: string,
        currentConstruction?: string,
        customPartyName?: string
    ): boolean => {
        if (!rollNo || !Array.isArray(brushingReceivesList)) return false;
        const normalizedVal = rollNo.trim().toLowerCase();
        
        const weaverId = currentWeaverId || Number(watch("weaverId"));
        const selectedWeaver = weaverOptions.find(w => String(w.id) === String(weaverId));
        const currentPartyName = customPartyName ? customPartyName.trim().toLowerCase() : (selectedWeaver ? selectedWeaver.label.trim().toLowerCase() : "");

        const invoiceNoVal = currentInvoiceNo !== undefined ? currentInvoiceNo : (watch("invoiceNo") || "");
        const cleanCurrentInvoiceNo = invoiceNoVal.trim().toLowerCase();

        const fabricId = watch("fabricMasterId");
        const selectedFabric = fabricOptions.find(f => String(f.id) === String(fabricId));
        const constructionVal = currentConstruction !== undefined ? currentConstruction : (selectedFabric ? selectedFabric.label : "");
        const cleanCurrentConstruction = constructionVal.trim().toLowerCase();

        if (!weaverId && !currentPartyName) return false;

        return brushingReceivesList.some(receive => {
            if (editId && receive.id === editId) return false;

            if (Array.isArray(receive.details)) {
                return receive.details.some((detail: any) => {
                    const isPieceMatch = detail.pieceNumber && detail.pieceNumber.trim().toLowerCase() === normalizedVal;
                    if (!isPieceMatch) return false;

                    // 1. Verify weaver/party match:
                    const isWeaverMatch = 
                        (detail.vendorId && Number(detail.vendorId) === weaverId) ||
                        (detail.partyName && currentPartyName && detail.partyName.trim().toLowerCase() === currentPartyName) ||
                        (receive.weaverId && Number(receive.weaverId) === weaverId) ||
                        (receive.vendorId && Number(receive.vendorId) === weaverId);

                    if (!isWeaverMatch) return false;

                    // 2. Verify invoice number match:
                    const dbInvoiceNo = (detail.invoiceNo || receive.invoiceNo || "").trim().toLowerCase();
                    const isInvoiceMatch = dbInvoiceNo === cleanCurrentInvoiceNo;
                    if (!isInvoiceMatch) return false;

                    // 3. Verify construction match:
                    const dbConstruction = (detail.construction || receive.construction || "").trim().toLowerCase();
                    const isConstructionMatch = dbConstruction === cleanCurrentConstruction;
                    if (!isConstructionMatch) return false;

                    return true;
                });
            }
            return false;
        });
    };

    // Fetch initial data
    useEffect(() => {
        const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
        if (storedCompanyId) {
            const numericId = Number(storedCompanyId);
            setCompanyId(numericId);
            dispatch(getAllVendors({ fetchAll: true } as any));
            dispatch(getAllCustomers({ fetchAll: true } as any));
            dispatch(getAllFabricMasters({ fetchAll: true } as any));
            dispatch(getAllSubCategories({ fetchAll: true } as any));
            dispatch(getAllBrushingReceivesByCompany(numericId) as any);

            // Auto-generate a receipt challan ONLY if not editing
            if (!editId) {
                const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                setValue("receiveChallanNo", `BR-${dateStr}-${randomSuffix}`);
            }
        }
    }, [dispatch, setValue, editId]);

    // Reset vendor when order type changes
    useEffect(() => {
        if (!editId) {
            setValue("buyerId", "");
        }
    }, [orderType, setValue, editId]);

    const isWeaver = (v: any) => {
        if (v.vendorTypeIds && Array.isArray(v.vendorTypeIds)) {
            return v.vendorTypeIds.includes(303) || v.vendorTypeIds.includes("303");
        }
        if (v.vendorTypeId) {
            return String(v.vendorTypeId) === "303" || String(v.vendorTypeId).split(',').map((s: string) => s.trim()).includes("303");
        }
        return false;
    };

    // Filter weavers based on order type and type = 303
    const weaverOptions = useMemo<CommonSearchableSelectOption[]>(() => {
        const list = Array.isArray(vendorList) 
            ? vendorList 
            : (vendorList?.data && Array.isArray(vendorList.data.data)) 
                ? vendorList.data.data 
                : (vendorList?.data && Array.isArray(vendorList.data))
                    ? vendorList.data
                    : [];
        const isInternalTarget = orderType === "INHOUSE" ? 1 : 0;
        const filtered = list.filter((v: any) => {
            if (!isWeaver(v)) return false;
            const isInternal = v.isInternalVendorId !== undefined ? v.isInternalVendorId : (v.isInternalVendor !== undefined ? v.isInternalVendor : 0);
            return Number(isInternal) === isInternalTarget;
        });
        return filtered.map((v: any) => ({
            id: v.id,
            value: String(v.id),
            label: v.vendorName,
            activeFlag: v.activeFlag ?? true
        }));
    }, [vendorList, orderType]);

    // Customer Selector for Buyer
    const customerOptions = useMemo<CommonSearchableSelectOption[]>(() => {
        const list = Array.isArray(customerList) 
            ? customerList 
            : (customerList?.data && Array.isArray(customerList.data.data)) 
                ? customerList.data.data 
                : (customerList?.data && Array.isArray(customerList.data))
                    ? customerList.data
                    : [];
        return list.map((c: any) => ({
            id: c.id,
            value: String(c.id),
            label: c.customerName ?? c.name ?? "",
            activeFlag: c.activeFlag ?? true
        }));
    }, [customerList]);

    // Fabric Master List mapping
    const fabricOptions = useMemo<CommonSearchableSelectOption[]>(() => {
        const raw = fabricMasterList as any;
        const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        return arr.map((item: any) => ({
            id: item.id,
            value: String(item.id),
            label: `${item.fabricCode} - ${item.fabricQuality}`,
            activeFlag: item.activeFlag ?? true
        }));
    }, [fabricMasterList]);

    const normalizeStr = (str: string) => {
        if (!str) return "";
        return str.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    };

    const findFabricMasterId = (constructionStr: string) => {
        if (!constructionStr) return undefined;
        const normConstruction = normalizeStr(constructionStr);
        if (!normConstruction) return undefined;

        const rawFabricList = fabricMasterList as any;
        const allFabrics = Array.isArray(rawFabricList?.data)
            ? rawFabricList.data
            : Array.isArray(rawFabricList)
                ? rawFabricList
                : [];
        
        // 0. Try matching using signature (for high-fidelity quality checks)
        const signatureTarget = getMatchableSignature(constructionStr);
        let match = allFabrics.find((f: any) => {
            if (!f.fabricQuality) return false;
            const sig = getMatchableSignature(f.fabricQuality);
            return sig && sig === signatureTarget;
        });
        if (match) return match.id;
        
        // 0.5. Try matching using numeric signature (extract all numbers)
        const numericTarget = getNumberSignature(constructionStr);
        match = allFabrics.find((f: any) => {
            if (!f.fabricQuality) return false;
            const sig = getNumberSignature(f.fabricQuality);
            return sig && sig === numericTarget;
        });
        if (match) return match.id;
        
        // 1. Try matching normalized construction against normalized full option label (code - quality)
        match = allFabrics.find((f: any) => {
            const fullOption = `${f.fabricCode || ""} - ${f.fabricQuality || ""}`;
            return normalizeStr(fullOption) === normConstruction;
        });
        if (match) return match.id;

        // 2. Try matching normalized construction against normalized fabricQuality
        match = allFabrics.find((f: any) => f.fabricQuality && normalizeStr(f.fabricQuality) === normConstruction);
        if (match) return match.id;

        // 3. Try matching normalized construction against normalized fabricCode
        match = allFabrics.find((f: any) => f.fabricCode && normalizeStr(f.fabricCode) === normConstruction);
        if (match) return match.id;

        // 4. Try matching normalized fabricQuality within normalized construction, or vice-versa
        match = allFabrics.find((f: any) => {
            if (!f.fabricQuality) return false;
            const normQual = normalizeStr(f.fabricQuality);
            return normQual && (normConstruction.includes(normQual) || normQual.includes(normConstruction));
        });
        if (match) return match.id;

        // 5. Try matching normalized fabricCode within normalized construction, or vice-versa
        match = allFabrics.find((f: any) => {
            if (!f.fabricCode) return false;
            const normCode = normalizeStr(f.fabricCode);
            return normCode && (normConstruction.includes(normCode) || normCode.includes(normConstruction));
        });
        if (match) return match.id;

        return undefined;
    };

    const findVendorId = (partyNameStr: string) => {
        if (!partyNameStr) return undefined;
        const normParty = normalizeStr(partyNameStr);
        if (!normParty) return undefined;

        const rawVendorList = vendorList as any;
        const allVendors = Array.isArray(rawVendorList) 
            ? rawVendorList 
            : (rawVendorList?.data && Array.isArray(rawVendorList.data.data)) 
                ? rawVendorList.data.data 
                : (rawVendorList?.data && Array.isArray(rawVendorList.data))
                    ? rawVendorList.data
                    : [];
        
        // 1. Try exact match on normalized vendorName
        let match = allVendors.find((v: any) => v.vendorName && normalizeStr(v.vendorName) === normParty);
        if (match) return match.id;

        // 2. Try contains match
        match = allVendors.find((v: any) => {
            if (!v.vendorName) return false;
            const normName = normalizeStr(v.vendorName);
            return normName && (normName.includes(normParty) || normParty.includes(normName));
        });
        if (match) return match.id;

        return undefined;
    };

    // Fetch current receive for edit mode
    useEffect(() => {
        if (editId) {
            dispatch(getBrushingReceiveById(editId));
        } else {
            dispatch(resetCurrentReceive());
        }
    }, [dispatch, editId]);

    // Prefill form and pieces in edit mode
    useEffect(() => {
        if (editId && currentReceive && String(currentReceive.id) === String(editId)) {
            setValue("receiveDate", currentReceive.receiveDate?.split("T")[0] || "");
            setValue("receiveChallanNo", currentReceive.receiveChallanNo || "");
            setValue("orderType", currentReceive.orderType || "JOBWORK");
            setValue("buyerId", currentReceive.buyerId ? String(currentReceive.buyerId) : "");
            setValue("fabricMasterId", currentReceive.fabricMasterId ? String(currentReceive.fabricMasterId) : "");
            setValue("remarks", currentReceive.remarks || "");
            setValue("weaverId", currentReceive.weaverId ? String(currentReceive.weaverId) : "");
            setValue("refPoNo", currentReceive.refPoNo || "");

            if (Array.isArray(currentReceive.details)) {
                if (currentReceive.details.length > 0) {
                    const firstDetail = currentReceive.details[0];
                    const initialInvoiceNo = currentReceive.refInvoiceNo || firstDetail?.invoiceNo || "";
                    const initialTc = firstDetail?.tc || "";
                    setValue("invoiceNo", initialInvoiceNo);
                    setValue("tc", initialTc);
                }

                const mapped = currentReceive.details.map((d: any) => {
                    return {
                        pieceEntryId: d.pieceEntryId,
                        pieceNumber: d.pieceNumber,
                        greigeMeters: d.greigeMeters,
                        greigeWeight: d.greigeWeight,
                        greigeGrossWt: d.greigeGrossWt ?? 0,
                        brushedMeters: String(d.brushedMeters),
                        brushedWeight: String(d.brushedWeight),
                        brushedGrossWt: String(d.brushedGrossWt ?? 0),
                        shrinkagePercentage: d.shrinkagePercentage,
                        weightLossPercentage: d.weightLossPercentage,
                        isBrushed: d.isBrushed ?? 0,
                        isUnwound: d.isUnwound ?? 0,
                        costPerUnit: String(d.costPerUnit),
                        totalAmount: String(d.totalAmount),
                        date: d.date || "",
                        partyName: d.partyName || "",
                        invoiceNo: d.invoiceNo || "",
                        tc: d.tc || "",
                        construction: d.construction || "",
                        weave: d.weave || "",
                        glm: d.glm || 0,
                        vendorId: d.vendorId,
                        fabricMasterId: d.fabricMasterId,
                        passMtr: d.passMtr !== null && d.passMtr !== undefined ? d.passMtr : null,
                        unwindStatus: d.unwindStatus || "PENDING",
                        brushingStatus: d.brushingStatus || "PENDING",
                        brushingMachineNo: d.brushingMachineNo || "",
                        unwindRemarks: d.unwindRemarks || "",
                        unwoundMeters: d.unwoundMeters,
                        unwoundWeight: d.unwoundWeight,
                        unwoundGrossWt: d.unwoundGrossWt,
                        isRejected: d.isRejected
                    };
                });
                setPieces(mapped);
            }
        }
    }, [currentReceive, editId, setValue]);

    // Sync dropdown values once options are loaded in edit mode
    useEffect(() => {
        if (editId && currentReceive && String(currentReceive.id) === String(editId)) {
            if (fabricOptions.length > 0 && currentReceive.fabricMasterId) {
                setValue("fabricMasterId", String(currentReceive.fabricMasterId));
            }
        }
    }, [currentReceive, editId, fabricOptions, setValue]);

    useEffect(() => {
        if (editId && currentReceive && String(currentReceive.id) === String(editId)) {
            if (customerOptions.length > 0 && currentReceive.buyerId) {
                setValue("buyerId", String(currentReceive.buyerId));
            }
        }
    }, [currentReceive, editId, customerOptions, setValue]);

    useEffect(() => {
        if (editId && currentReceive && String(currentReceive.id) === String(editId)) {
            if (weaverOptions.length > 0 && currentReceive.weaverId) {
                setValue("weaverId", String(currentReceive.weaverId));
            }
        }
    }, [currentReceive, editId, weaverOptions, setValue]);

    // Recalculate shrinkage, weight loss, and total amount
    const updatePieceRowValues = (
        index: number,
        field: keyof BrushingReceiveDetailRow | "pieceNumber" | "greigeMeters" | "greigeWeight" | "greigeGrossWt",
        value: string
    ) => {
        setPieces((prev) => {
            const copy = [...prev];
            const row = { ...copy[index] };

            if (field === "pieceNumber") {
                row.pieceNumber = value;
            } else if (field === "greigeMeters") {
                const gm = Number(value) || 0;
                row.greigeMeters = gm;
                const bm = Number(row.brushedMeters) || 0;
                if (gm > 0) {
                    row.shrinkagePercentage = Number((((bm - gm) / gm) * 100).toFixed(2));
                    row.glm = Number((row.greigeWeight / gm).toFixed(4));
                } else {
                    row.shrinkagePercentage = 0;
                    row.glm = 0;
                }
            } else if (field === "greigeWeight") {
                const gw = Number(value) || 0;
                row.greigeWeight = gw;
                const bw = Number(row.brushedWeight) || 0;
                if (gw > 0) {
                    row.weightLossPercentage = Number((((bw - gw) / gw) * 100).toFixed(2));
                } else {
                    row.weightLossPercentage = 0;
                }
                if (row.greigeMeters > 0) {
                    row.glm = Number((gw / row.greigeMeters).toFixed(4));
                } else {
                    row.glm = 0;
                }
            } else if (field === "greigeGrossWt") {
                row.greigeGrossWt = Number(value) || 0;
            } else if (field === "brushedMeters") {
                row.brushedMeters = value;
                const bm = Number(value) || 0;
                const gm = row.greigeMeters;
                if (gm > 0) {
                    row.shrinkagePercentage = Number((((bm - gm) / gm) * 100).toFixed(2));
                } else {
                    row.shrinkagePercentage = 0;
                }
                const cpu = Number(row.costPerUnit) || 0;
                row.totalAmount = (bm * cpu).toFixed(2);
            } else if (field === "brushedWeight") {
                row.brushedWeight = value;
                const bw = Number(value) || 0;
                const gw = row.greigeWeight;
                if (gw > 0) {
                    row.weightLossPercentage = Number((((bw - gw) / gw) * 100).toFixed(2));
                } else {
                    row.weightLossPercentage = 0;
                }
            } else if (field === "costPerUnit") {
                row.costPerUnit = value;
                const bm = Number(row.brushedMeters) || 0;
                const cpu = Number(value) || 0;
                row.totalAmount = (bm * cpu).toFixed(2);
            } else if (field === "glm") {
                row.glm = Number(value) || 0;
            } else if (field === "passMtr") {
                row.passMtr = value !== "" ? Number(value) : null;
            } else if (field === "brushingStatus") {
                if (value === "READY_FOR_DISPATCH") {
                    row.brushingStatus = "READY_FOR_DISPATCH";
                    row.unwindStatus = "ACCEPTED";
                    row.isUnwound = 1;
                    row.isBrushed = 1;
                    row.brushedMeters = String(row.passMtr !== null && row.passMtr !== undefined ? row.passMtr : row.greigeMeters);
                    row.brushedWeight = String(row.greigeWeight);
                    row.brushedGrossWt = String(row.greigeGrossWt);
                    row.unwoundMeters = Number(row.greigeMeters);
                    row.unwoundWeight = Number(row.greigeWeight);
                    row.unwoundGrossWt = Number(row.greigeGrossWt);
                    row.brushingMachineNo = "AUTO";
                } else if (value === "UNDER_BRUSHING") {
                    row.brushingStatus = "PENDING";
                    row.unwindStatus = "ACCEPTED";
                    row.isUnwound = 1;
                    row.isBrushed = 0;
                    row.brushedMeters = "0";
                    row.brushedWeight = "0";
                    row.brushedGrossWt = "0";
                    row.unwoundMeters = Number(row.greigeMeters);
                    row.unwoundWeight = Number(row.greigeWeight);
                    row.unwoundGrossWt = Number(row.greigeGrossWt);
                    row.brushingMachineNo = "";
                } else {
                    row.brushingStatus = "PENDING";
                    row.unwindStatus = "PENDING";
                    row.isUnwound = 0;
                    row.isBrushed = 0;
                    row.brushedMeters = "0";
                    row.brushedWeight = "0";
                    row.brushedGrossWt = "0";
                    row.unwoundMeters = 0;
                    row.unwoundWeight = 0;
                    row.unwoundGrossWt = 0;
                    row.brushingMachineNo = "";
                }
            } else if (field === "date" || field === "partyName" || field === "invoiceNo" || field === "tc" || field === "construction" || field === "weave" || field === "hfplRollNo" || field === "brushingDate") {
                (row as any)[field] = value;
            }

            copy[index] = row;
            return copy;
        });
    };

    const handleAddManualPiece = () => {
        const rDate = watch("receiveDate") || "";
        const vId = watch("weaverId") || "";
        const fId = watch("fabricMasterId") || "";

        const selectedVendor = weaverOptions.find(v => String(v.id) === String(vId));
        const partyName = selectedVendor ? selectedVendor.label : "";

        const selectedFabric = fabricOptions.find((f) => String(f.id) === String(fId));
        const construction = selectedFabric ? selectedFabric.label : "";

        const selectedFabricMaster = (() => {
            if (!fId) return null;
            const raw = fabricMasterList as any;
            const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
            return arr.find((f: any) => String(f.id) === String(fId)) || null;
        })();
        const resolvedWeave = (() => {
            if (!selectedFabricMaster || !selectedFabricMaster.weave) return "";
            const weaveId = selectedFabricMaster.weave;
            const weaveSubCategory = subCategoryList.find((sc: any) => String(sc.id) === String(weaveId));
            return weaveSubCategory ? weaveSubCategory.subCategoryName : "";
        })();

        const invoiceNo = watch("invoiceNo") || "";
        const tc = watch("tc") || "";

        setPieces((prev) => [
            ...prev,
            {
                pieceEntryId: 0,
                pieceNumber: "",
                greigeMeters: 0,
                greigeWeight: 0,
                greigeGrossWt: 0,
                brushedMeters: "0",
                brushedWeight: "0",
                brushedGrossWt: "0",
                shrinkagePercentage: 0,
                weightLossPercentage: 0,
                isBrushed: 0,
                costPerUnit: "0",
                totalAmount: "0",
                date: rDate,
                partyName: partyName,
                invoiceNo: invoiceNo,
                tc: tc,
                construction: construction,
                weave: resolvedWeave,
                glm: 0,
                vendorId: vId ? Number(vId) : undefined,
                fabricMasterId: fId ? Number(fId) : undefined,
                passMtr: null,
                unwindStatus: "PENDING",
                brushingStatus: "PENDING",
                brushingMachineNo: "",
                unwindRemarks: "",
                unwoundMeters: 0,
                unwoundWeight: 0,
                unwoundGrossWt: 0,
                isRejected: 0,
                hfplRollNo: "",
                brushingDate: ""
            }
        ]);
    };

    const handleDownloadTemplate = () => {
        const headers = [
            'ROLL NO',
            'RECIVING MTR',
            'GROSS WT',
            'NET WT'
        ];
        generateExcelTemplate({
            headers,
            fileName: 'brushing-receive-direct-template'
        });
    };

    const handleExportExcel = () => {
        if (pieces.length === 0) {
            toast.warning("No pieces to export.");
            return;
        }

        const dataToExport = pieces.map((p) => ({
            'ROLL NO': p.pieceNumber || "",
            'RECIVING MTR': Number(p.greigeMeters) || 0,
            'GROSS WT': Number(p.greigeGrossWt) || 0,
            'NET WT': Number(p.greigeWeight) || 0
        }));

        exportToExcel(dataToExport, `brushing-receive-pieces-${watch("receiveChallanNo") || "export"}`, {
            headers: ['ROLL NO', 'RECIVING MTR', 'GROSS WT', 'NET WT']
        });
        toast.success("Excel exported successfully.");
    };


    const handleUploadButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleDeleteAllPieces = () => {
        if (pieces.length === 0) {
            toast.warning("No pieces to delete.");
            return;
        }
        if (window.confirm("Are you sure you want to delete all pieces from the list?")) {
            setPieces([]);
            toast.success("All pieces cleared successfully.");
        }
    };

    const handleRemovePiece = (index: number) => {
        setPieces((prev) => prev.filter((_, i) => i !== index));
    };

    // Bulk Inward Upload parser (Excel & CSV)
    const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        const allowedExtensions = ['.xlsx', '.xls', '.csv'];
        if (!allowedExtensions.includes(extension)) {
            toast.error("Only Excel (.xlsx, .xls) and CSV (.csv) files are supported.");
            event.target.value = "";
            return;
        }

        const rDate = watch("receiveDate");
        const vId = watch("weaverId");
        const fId = watch("fabricMasterId");

        try {
            setIsImporting(true);
            const rows = await readExcelFile<Record<string, any>>(file);
            if (!Array.isArray(rows) || rows.length === 0) {
                toast.error("No data found in the uploaded file.");
                setIsImporting(false);
                event.target.value = "";
                return;
            }

            const keysToMatch = {
                pieceNo: ['pieceno', 'rollno', 'rollnumber', 'piecenumber', 'piece', 'roll'],
                greigeMeters: ['greigeqty', 'greigemeters', 'meters', 'mtr', 'qty', 'quantity', 'length', 'piecemeter', 'totalmtr', 'piecelength', 'recivingmtr', 'receivingmtr'],
                greigeWeight: ['greigewt', 'greigeweight', 'netwt', 'netweight', 'weight', 'wt', 'kg'],
                greigeGrossWt: ['grosswt', 'grossweight', 'gross', 'grwt'],
                partyName: ['partyname', 'party', 'vendor', 'vendorname', 'weaver', 'weavername'],
                invoiceNo: ['hoinvoiceno', 'invoiceno', 'invoice', 'refinvoiceno', 'invoicenumber'],
                construction: ['construction', 'quality', 'fabric', 'fabricconstruction', 'design'],
                weave: ['weave', 'fabricweave', 'weavetype']
            };

            const excludeKeys = {
                greigeMeters: ['wt', 'weight', 'brushed', 'finish', 'inspect', 'cost', 'rate', 'amount', 'gross'],
                greigeWeight: ['meters', 'mtr', 'brushed', 'finish', 'inspect', 'rate', 'cost', 'amount', 'gross'],
                greigeGrossWt: ['meters', 'mtr', 'brushed', 'finish', 'inspect', 'rate', 'cost', 'amount', 'net'],
                pieceNo: ['invoice', 'challan']
            };

            const findHeaderKey = (row: Record<string, any>, possibleKeys: string[], excludes: string[] = []) => {
                return Object.keys(row).find(key => {
                    const clean = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                    const isExcluded = excludes.some(ex => clean.includes(ex.trim().toLowerCase().replace(/[^a-z0-9]/g, '')));
                    if (isExcluded) return false;
                    return possibleKeys.some(pk => clean.includes(pk.trim().toLowerCase().replace(/[^a-z0-9]/g, '')));
                });
            };

            const selectedVendor = vId ? weaverOptions.find(v => String(v.id) === String(vId)) : null;
            const headerPartyName = selectedVendor ? selectedVendor.label : "";

            const selectedFabric = fId ? fabricOptions.find((f) => String(f.id) === String(fId)) : null;
            const headerConstruction = selectedFabric ? selectedFabric.label : "";

            // Detect headers from first row
            const firstRow = rows[0];
            const pieceKey = findHeaderKey(firstRow, keysToMatch.pieceNo, excludeKeys.pieceNo);
            const greigeMetersKey = findHeaderKey(firstRow, keysToMatch.greigeMeters, excludeKeys.greigeMeters);
            const greigeWeightKey = findHeaderKey(firstRow, keysToMatch.greigeWeight, excludeKeys.greigeWeight);
            const greigeGrossWtKey = findHeaderKey(firstRow, keysToMatch.greigeGrossWt, excludeKeys.greigeGrossWt);
            const constructionKey = (() => {
                // 1. Try finding by matching keys on the header keys (excluding status/date/etc. columns to prevent false matches)
                const excludeConstKeys = ['status', 'stage', 'state', 'date', 'invoice', 'party', 'roll', 'meter', 'weight', 'wt', 'glm', 'variation'];
                const matchedKey = Object.keys(firstRow).find(key => {
                    const clean = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (!clean) return false;
                    const isConstKey = ['quality', 'fabricconstruction', 'design', 'construction', 'fabric'].some(pk => clean === pk || clean.includes(pk));
                    const isExcluded = excludeConstKeys.some(ek => clean.includes(ek));
                    return isConstKey && !isExcluded;
                });
                if (matchedKey) return matchedKey;

                // 2. Scan row values for construction patterns (fallback for blank/spaced header)
                return Object.keys(firstRow).find(key => {
                    for (let r = 0; r < Math.min(rows.length, 10); r++) {
                        const cellVal = rows[r]?.[key];
                        if (cellVal) {
                            const strVal = String(cellVal).trim();
                            if (strVal.includes('/') && (strVal.includes('x') || strVal.includes('*')) && strVal.replace(/[^0-9]/g, '').length >= 3) {
                                return true;
                            }
                        }
                    }
                    return false;
                });
            })();
            const partyNameKey = findHeaderKey(firstRow, keysToMatch.partyName);
            const invoiceNoKey = findHeaderKey(firstRow, keysToMatch.invoiceNo);
            const weaveKey = findHeaderKey(firstRow, keysToMatch.weave);

            if (!pieceKey) {
                toast.error("Could not identify Piece No / Roll No column in Excel.");
                setIsImporting(false);
                event.target.value = "";
                return;
            }

            const invoiceNo = watch("invoiceNo") || "";
            const fullInvoiceNo = invoiceNo;
            const tcVal = watch("tc") || "";



            const selectedFabricMaster = (() => {
                if (!fId) return null;
                const raw = fabricMasterList as any;
                const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
                return arr.find((f: any) => String(f.id) === String(fId)) || null;
            })();

            const resolvedWeave = (() => {
                if (!selectedFabricMaster || !selectedFabricMaster.weave) return "";
                const weaveId = selectedFabricMaster.weave;
                const weaveSubCategory = subCategoryList.find((sc: any) => String(sc.id) === String(weaveId));
                return weaveSubCategory ? weaveSubCategory.subCategoryName : "";
            })();

            let matchCount = 0;
            const excelPieces: BrushingReceiveDetailRow[] = [];

            rows.forEach(row => {
                const csvPieceNo = row[pieceKey] ? String(row[pieceKey]).trim() : "";
                if (!csvPieceNo) return;

                const finalGreigeMeters = greigeMetersKey && row[greigeMetersKey] !== undefined ? Number(row[greigeMetersKey]) || 0 : 0;
                const finalGreigeWeight = greigeWeightKey && row[greigeWeightKey] !== undefined ? Number(row[greigeWeightKey]) || 0 : 0;
                const finalGreigeGrossWt = greigeGrossWtKey && row[greigeGrossWtKey] !== undefined ? Number(row[greigeGrossWtKey]) || 0 : 0;

                const finalPassMtr = null;
                const finalBrushingStatus = "PENDING";
                const finalUnwindStatus = "PENDING";
                const finalIsUnwound = 0;
                const finalIsBrushed = 0;
                const finalBrushedMeters = "0";
                const finalBrushedWeight = "0";
                const finalBrushedGrossWt = "0";
                const finalUnwoundMeters = 0;
                const finalUnwoundWeight = 0;
                const finalUnwoundGrossWt = 0;
                const finalMachineNo = "";

                const finalGlm = finalGreigeMeters > 0 ? Number((finalGreigeWeight / finalGreigeMeters).toFixed(4)) : 0;

                const rowPartyName = partyNameKey && row[partyNameKey] ? String(row[partyNameKey]).trim() : headerPartyName;
                const rowInvoiceNo = invoiceNoKey && row[invoiceNoKey] ? String(row[invoiceNoKey]).trim() : fullInvoiceNo;
                const rowConstruction = constructionKey && row[constructionKey] ? String(row[constructionKey]).trim() : headerConstruction;

                const rowVendorId = findVendorId(rowPartyName) || (vId ? Number(vId) : undefined);
                const rowFabricMasterId = findFabricMasterId(rowConstruction) || (fId ? Number(fId) : undefined);

                const rowFabricMaster = (() => {
                    if (!rowFabricMasterId) return null;
                    const raw = fabricMasterList as any;
                    const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
                    return arr.find((f: any) => String(f.id) === String(rowFabricMasterId)) || null;
                })();

                const excelWeaveVal = weaveKey && row[weaveKey] ? String(row[weaveKey]).trim() : "";
                const rowWeave = (() => {
                    if (excelWeaveVal) return excelWeaveVal;
                    if (!rowFabricMaster || !rowFabricMaster.weave) return resolvedWeave;
                    const weaveId = rowFabricMaster.weave;
                    const weaveSubCategory = subCategoryList.find((sc: any) => String(sc.id) === String(weaveId));
                    return weaveSubCategory ? weaveSubCategory.subCategoryName : resolvedWeave;
                })();

                const finalHfplRollNo = "";
                const finalBrushingDate = "";

                excelPieces.push({
                    pieceEntryId: 0,
                    pieceNumber: csvPieceNo,
                    greigeMeters: finalGreigeMeters,
                    greigeWeight: finalGreigeWeight,
                    greigeGrossWt: finalGreigeGrossWt,
                    brushedMeters: finalBrushedMeters,
                    brushedWeight: finalBrushedWeight,
                    brushedGrossWt: finalBrushedGrossWt,
                    shrinkagePercentage: 0,
                    weightLossPercentage: 0,
                    isBrushed: finalIsBrushed,
                    isUnwound: finalIsUnwound,
                    costPerUnit: "0",
                    totalAmount: "0",
                    date: rDate || "",
                    partyName: rowPartyName || "",
                    invoiceNo: rowInvoiceNo,
                    tc: tcVal,
                    construction: rowFabricMaster ? `${rowFabricMaster.fabricCode} - ${rowFabricMaster.fabricQuality}` : (rowConstruction || ""),
                    weave: rowWeave,
                    glm: finalGlm,
                    fabricMasterId: rowFabricMasterId,
                    vendorId: rowVendorId,
                    passMtr: finalPassMtr,
                    unwindStatus: finalUnwindStatus,
                    brushingStatus: finalBrushingStatus,
                    brushingMachineNo: finalMachineNo,
                    unwoundMeters: finalUnwoundMeters,
                    unwoundWeight: finalUnwoundWeight,
                    unwoundGrossWt: finalUnwoundGrossWt,
                    isRejected: 0,
                    hfplRollNo: finalHfplRollNo,
                    brushingDate: finalBrushingDate
                });
                matchCount++;
            });


            setPieces(excelPieces);
            toast.success(`Successfully uploaded bulk data! Processed ${matchCount} piece(s).`);
        } catch (error) {
            console.error("Error reading file:", error);
            toast.error("Failed to process the uploaded file. Please check format.");
        } finally {
            setIsImporting(false);
            event.target.value = "";
        }
    };

    const onSubmit = (data: FormValues) => {
        if (!data.buyerId) {
            toast.error("Buyer is required.");
            return;
        }

        if (pieces.length === 0) {
            toast.error("Please add or upload at least one fabric piece.");
            return;
        }

        // Validate piece entries
        const selectedFabric = fabricOptions.find(f => String(f.id) === String(data.fabricMasterId));
        const resolvedConstruction = selectedFabric ? selectedFabric.label : "";

        for (const piece of pieces) {
            const rollNo = piece.pieceNumber?.trim();
            if (!rollNo) {
                toast.error("Piece Number is required for all rows.");
                return;
            }
            if (piece.greigeMeters < 0) {
                toast.error(`Greige Qty cannot be negative for piece ${piece.pieceNumber}`);
                return;
            }
        }

        const selectedWeaver = weaverOptions.find(w => String(w.id) === String(data.weaverId));
        const resolvedPartyName = selectedWeaver ? selectedWeaver.label : "";



        const selectedFabricMaster = (() => {
            if (!data.fabricMasterId) return null;
            const raw = fabricMasterList as any;
            const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
            return arr.find((f: any) => String(f.id) === String(data.fabricMasterId)) || null;
        })();

        const resolvedWeave = (() => {
            if (!selectedFabricMaster || !selectedFabricMaster.weave) return "";
            const weaveId = selectedFabricMaster.weave;
            const weaveSubCategory = subCategoryList.find((sc: any) => String(sc.id) === String(weaveId));
            return weaveSubCategory ? weaveSubCategory.subCategoryName : "";
        })();

        const fullInvoiceNo = data.invoiceNo || "";

        const payload = {
            id: editId || undefined,
            receiveChallanNo: data.receiveChallanNo,
            receiveDate: data.receiveDate,
            remarks: data.remarks,
            companyId: companyId,
            orderType: data.orderType,
            buyerId:Number(data.buyerId) || undefined,
            weaverId:Number(data.weaverId) || undefined,
            fabricMasterId: Number(data.fabricMasterId) || undefined,
            refInvoiceNo: data.invoiceNo,
            refPoNo: data.refPoNo || "",
            details: pieces.map(p => ({
                pieceNumber: p.pieceNumber,
                greigeMeters: Number(p.greigeMeters) || 0,
                greigeWeight: Number(p.greigeWeight) || 0,
                greigeGrossWt: Number(p.greigeGrossWt) || 0,
                brushedMeters: Number(p.brushedMeters) || 0,
                brushedWeight: Number(p.brushedWeight) || 0,
                brushedGrossWt: Number(p.brushedGrossWt) || 0,
                shrinkagePercentage: p.shrinkagePercentage,
                weightLossPercentage: p.weightLossPercentage,
                isBrushed: p.isBrushed ?? 0,
                isUnwound: p.isUnwound ?? 0,
                costPerUnit: Number(p.costPerUnit) || 0,
                totalAmount: Number(p.totalAmount) || 0,
                tc: p.tc || data.tc || "",
                weave: p.weave || resolvedWeave || "",
                date: data.receiveDate || "",
                partyName: p.partyName || resolvedPartyName || "",
                invoiceNo: p.invoiceNo || fullInvoiceNo || "",
                construction: p.construction || resolvedConstruction || "",
                glm: Number(p.greigeMeters) > 0 ? Number((Number(p.greigeWeight) / Number(p.greigeMeters)).toFixed(4)) : 0,
                fabricMasterId: p.fabricMasterId || Number(data.fabricMasterId) || undefined,
                vendorId: p.vendorId || Number(data.weaverId) || undefined,
                passMtr: p.passMtr !== null && p.passMtr !== undefined && p.passMtr !== "" ? Number(p.passMtr) : null,
                unwindStatus: p.unwindStatus || "PENDING",
                brushingStatus: p.brushingStatus || "PENDING",
                brushingMachineNo: p.brushingMachineNo || "",
                unwindRemarks: p.unwindRemarks || "",
                unwoundMeters: p.unwoundMeters !== undefined ? Number(p.unwoundMeters) : 0,
                unwoundWeight: p.unwoundWeight !== undefined ? Number(p.unwoundWeight) : 0,
                unwoundGrossWt: p.unwoundGrossWt !== undefined ? Number(p.unwoundGrossWt) : 0,
                isRejected: p.isRejected ?? 0,
                unwindDate: p.brushingStatus === "READY_FOR_DISPATCH" ? (p.brushingDate || data.receiveDate || new Date().toISOString().split("T")[0]) : null,
                brushingDate: p.brushingDate || (p.brushingStatus === "READY_FOR_DISPATCH" ? (data.receiveDate || new Date().toISOString().split("T")[0]) : null),
                hfplRollNo: p.hfplRollNo || ""
            }))
        };

        console.log("Submitting payload:", payload);
        const actionThunk = editId
            ? updateBrushingReceive({ id: editId, dto: payload })
            : createBrushingReceive(payload);

        dispatch(actionThunk as any)
            .unwrap()
            .then(() => {
                navigate("/transaction/brushing-receive-details");
            });
    };

    // Derived values from Header Info
    const receiveDate = watch("receiveDate") || "";
    const weaverId = watch("weaverId") || "";
    const selectedWeaver = weaverOptions.find(w => String(w.id) === String(weaverId));
    const partyName = selectedWeaver ? selectedWeaver.label : "";

    const invoiceNo = watch("invoiceNo") || "";
    const tc = watch("tc") || "";

    const fabricMasterId = watch("fabricMasterId") || "";
    const selectedFabric = fabricOptions.find(f => String(f.id) === String(fabricMasterId));
    const construction = selectedFabric ? selectedFabric.label : "";

    const selectedFabricMaster = useMemo(() => {
        if (!fabricMasterId) return null;
        const raw = fabricMasterList as any;
        const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        return arr.find((f: any) => String(f.id) === String(fabricMasterId)) || null;
    }, [fabricMasterId, fabricMasterList]);

    const weave = useMemo(() => {
        if (!selectedFabricMaster || !selectedFabricMaster.weave) return "";
        const weaveId = selectedFabricMaster.weave;
        const weaveSubCategory = subCategoryList.find((sc: any) => String(sc.id) === String(weaveId));
        return weaveSubCategory ? weaveSubCategory.subCategoryName : "";
    }, [selectedFabricMaster, subCategoryList]);

    const totalReceiveMeters = useMemo(() => {
        return pieces.reduce((sum, p) => sum + (Number(p.greigeMeters) || 0), 0);
    }, [pieces]);

    const filteredPiecesWithIndex = useMemo(() => {
        const mapped = pieces.map((piece, originalIndex) => ({ piece, originalIndex }));
        if (!receivedSearch.trim()) return mapped;
        const searchLower = receivedSearch.trim().toLowerCase();
        return mapped.filter(({ piece }) => {
            const pieceNo = String(piece.pieceNumber || '').toLowerCase();
            const date = String(piece.date || '').toLowerCase();
            const partyName = String(piece.partyName || '').toLowerCase();
            const invoiceNo = String(piece.invoiceNo || '').toLowerCase();
            const tc = String(piece.tc || '').toLowerCase();
            const construction = String(piece.construction || '').toLowerCase();
            const weave = String(piece.weave || '').toLowerCase();
            const greigeMeters = String(piece.greigeMeters || '');
            const greigeWeight = String(piece.greigeWeight || '');
            const greigeGrossWt = String(piece.greigeGrossWt || '');
            
            return pieceNo.includes(searchLower) ||
                   date.includes(searchLower) ||
                   partyName.includes(searchLower) ||
                   invoiceNo.includes(searchLower) ||
                   tc.includes(searchLower) ||
                   construction.includes(searchLower) ||
                   weave.includes(searchLower) ||
                   greigeMeters.includes(searchLower) ||
                   greigeWeight.includes(searchLower) ||
                   greigeGrossWt.includes(searchLower);

        });
    }, [pieces, receivedSearch]);

    return (
        <div className="p-6 pt-16">
            <div className="p-6 bg-white shadow-md rounded-lg">
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <div className="flex items-center space-x-4">
                        <Button
                            onClick={() => navigate("/transaction/brushing-receive-details")}
                            variant="outline"
                            className="mr-auto"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            Back
                        </Button>
                        <h2 className="text-2xl font-semibold">{editId ? "Edit Brushing Receive" : "New Brushing Receive"}</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold text-slate-800">Receive Header Info</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            
                            {/* Receive Date */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">Receive Date <span className="text-red-600">*</span></label>
                                <input
                                    type="date"
                                    {...register("receiveDate", { required: true })}
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            {/* Receive Challan No */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">Receive Challan No <span className="text-red-600">*</span></label>
                                <Input
                                    type="text"
                                    {...register("receiveChallanNo", { required: true })}
                                    className="rounded-xl border-slate-200"
                                />
                            </div>


                            {/* Order Type */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">Order Type <span className="text-red-600">*</span></label>
                                <select
                                    {...register("orderType")}
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="INHOUSE">Internal (Inhouse)</option>
                                    <option value="JOBWORK">External (Jobwork)</option>
                                </select>
                            </div>

                            {/* Customer Selector (Buyer) */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700"> Buyer <span className="text-red-600">*</span></label>
                                <CommonSearchableSelect
                                    options={customerOptions}
                                    onChange={(val) => setValue("buyerId", val)}
                                    value={watch("buyerId")}
                                    placeholder="Search & select buyer"
                                />
                            </div>

                            {/* Party Name (Weaver) Selector */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">Ref. Party Name (Weaver)</label>
                                <CommonSearchableSelect
                                    options={weaverOptions}
                                    onChange={(val) => setValue("weaverId", val)}
                                    value={watch("weaverId")}
                                    placeholder="Search & select weaver"
                                />
                            </div>

                            {/* Fabric Construction Selector */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">Fabric Construction</label>
                                <CommonSearchableSelect
                                    options={fabricOptions}
                                    onChange={(val) => setValue("fabricMasterId", val)}
                                    value={watch("fabricMasterId")}
                                    placeholder="Search & select fabric construction"
                                />
                            </div>

                            {/* Invoice No */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">Ref. Invoice No</label>
                                <Input
                                    type="text"
                                    {...register("invoiceNo")}
                                    placeholder="Enter Reference Invoice No...( e.g. HFPL/0293/25-26 )"
                                    className="rounded-xl border-slate-200"
                                />
                            </div>

                            {/* Ref. PO No */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">Ref. PO No</label>
                                <Input
                                    type="text"
                                    {...register("refPoNo")}
                                    placeholder="Enter Reference PO No..."
                                    className="rounded-xl border-slate-200"
                                />
                            </div>

                            {/* TC */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">TC</label>
                                <Input
                                    type="text"
                                    {...register("tc")}
                                    placeholder="Enter TC"
                                    className="rounded-xl border-slate-200"
                                />
                            </div>
                            
                            {/* Remarks */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">Remarks</label>
                                <Input
                                    type="text"
                                    {...register("remarks")}
                                    placeholder="Add receive remarks notes..."
                                    className="rounded-xl border-slate-200"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Received Pieces Grid */}
                    <Card>
                        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4 mb-4">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-xl font-semibold text-slate-800">Received Pieces</CardTitle>
                                {pieces.length > 0 && (
                                    <div className="inline-flex items-center gap-3 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full text-xs md:text-sm font-semibold shadow-sm">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                        </span>
                                        <span>No. of Rolls: <strong className="font-bold text-blue-900">{pieces.length}</strong></span>
                                        <span className="text-blue-300">|</span>
                                        <span>Total Receive Meter: <strong className="font-bold text-blue-900">{totalReceiveMeters.toFixed(2)} m</strong></span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleBulkUpload}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAddManualPiece}
                                    className="flex items-center"
                                >
                                    <Plus size={16} className="mr-2" />
                                    Add Piece
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleDownloadTemplate}
                                    className="flex items-center"
                                >
                                    <FileDown size={16} className="mr-2" />
                                    Download Template
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleExportExcel}
                                    className="flex items-center"
                                >
                                    <Download size={16} className="mr-2" />
                                    Export Excel
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleUploadButtonClick}
                                    disabled={isImporting}
                                    className="flex items-center"
                                >
                                    <Upload size={16} className="mr-2" />
                                    {isImporting ? 'Importing...' : 'Upload Excel'}
                                </Button>
                                {pieces.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={handleDeleteAllPieces}
                                            className="flex items-center bg-rose-600 hover:bg-rose-700 text-white border-transparent"
                                        >
                                            <Trash2 size={16} className="mr-2" />
                                            Delete All Rows
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent>
                            {pieces.length > 0 && (
                                <div className="mb-4 flex justify-end">
                                    <div className="relative w-full md:w-72">
                                        <Input
                                            type="text"
                                            placeholder="Search received pieces..."
                                            value={receivedSearch}
                                            onChange={(e) => setReceivedSearch(e.target.value)}
                                            className="w-full pl-3 pr-8 py-2 border rounded-xl text-sm"
                                        />
                                        {receivedSearch && (
                                            <button
                                                type="button"
                                                onClick={() => setReceivedSearch('')}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs animate-none"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                            {pieces.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    No pieces added yet. Use "Add Piece" or "Upload Excel" to populate fabric pieces.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 border text-center">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="border p-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                                                <th className="border p-3 text-xs font-semibold text-slate-500 uppercase">Ref. Party Name</th>
                                                <th className="border p-3 text-xs font-semibold text-slate-500 uppercase">Ref. Invoice No</th>
                                                <th className="border p-3 text-xs font-semibold text-slate-500 uppercase">TC</th>
                                                <th className="border p-3 text-xs font-semibold text-slate-500 uppercase">Construction</th>
                                                <th className="border p-3 text-xs font-semibold text-slate-500 uppercase">Weave</th>
                                                <th className="border p-3 text-xs font-semibold text-slate-500 uppercase">Roll No</th>
                                                <th className="border p-3 text-xs font-semibold text-slate-500 uppercase">Receiving Mtr</th>
                                                <th className="border p-3 text-xs font-semibold text-slate-500 uppercase">Gross Wt</th>
                                                <th className="border p-3 text-xs font-semibold text-slate-500 uppercase">Net Wt</th>
                                                <th className="border p-3 text-xs font-semibold text-slate-500 uppercase">GLM</th>
                                                <th className="border p-3 text-xs font-semibold text-slate-500 uppercase w-20">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-100">
                                            {filteredPiecesWithIndex.map(({ piece, originalIndex }, i) => {
                                                const calculatedGlm = Number(piece.greigeMeters) > 0 ? (Number(piece.greigeWeight) / Number(piece.greigeMeters)).toFixed(4) : "0.0000";
                                                return (
                                                    <tr key={originalIndex}>
                                                        <td className="border p-3 text-sm text-slate-600 whitespace-nowrap min-w-[100px]">
                                                            {(() => {
                                                                if (!receiveDate) return "-";
                                                                const parts = receiveDate.split("-");
                                                                if (parts.length === 3) {
                                                                    return `${parts[2]}/${parts[1]}/${parts[0]}`;
                                                                }
                                                                return receiveDate;
                                                            })()}
                                                        </td>
                                                        <td className="border p-3 text-sm text-slate-600 min-w-[120px]">
                                                            {piece.partyName || partyName || "-"}
                                                        </td>
                                                        <td className="border p-3 text-sm text-slate-600 min-w-[120px]">
                                                            {piece.invoiceNo || invoiceNo || "-"}
                                                        </td>
                                                        <td className="border p-3 text-sm text-slate-600 min-w-[80px]">
                                                            {piece.tc || tc || "-"}
                                                        </td>
                                                        <td className="border p-3 text-sm text-slate-600 min-w-[180px]">
                                                            {piece.construction || construction || "-"}
                                                        </td>
                                                        <td className="border p-3 text-sm text-slate-600 min-w-[100px]">
                                                            {piece.weave || weave || "-"}
                                                        </td>
                                                        <td className="border p-3">
                                                            <Input
                                                                type="text"
                                                                value={piece.pieceNumber}
                                                                onChange={(e) => updatePieceRowValues(originalIndex, "pieceNumber", e.target.value)}
                                                                className="w-24 text-center rounded-lg border-slate-200 py-1 px-2 text-sm mx-auto"
                                                                placeholder="Roll No"
                                                            />
                                                        </td>
                                                        <td className="border p-3">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={piece.greigeMeters}
                                                                onChange={(e) => updatePieceRowValues(originalIndex, "greigeMeters", e.target.value)}
                                                                className="w-20 text-right rounded-lg border-slate-200 py-1 px-2 text-sm mx-auto"
                                                            />
                                                        </td>
                                                        <td className="border p-3">
                                                            <Input
                                                                type="number"
                                                                step="0.001"
                                                                value={piece.greigeGrossWt}
                                                                onChange={(e) => updatePieceRowValues(originalIndex, "greigeGrossWt", e.target.value)}
                                                                className="w-20 text-right rounded-lg border-slate-200 py-1 px-2 text-sm mx-auto"
                                                            />
                                                        </td>
                                                        <td className="border p-3">
                                                            <Input
                                                                type="number"
                                                                step="0.001"
                                                                value={piece.greigeWeight}
                                                                onChange={(e) => updatePieceRowValues(originalIndex, "greigeWeight", e.target.value)}
                                                                className="w-20 text-right rounded-lg border-slate-200 py-1 px-2 text-sm mx-auto"
                                                            />
                                                        </td>
                                                         <td className="border p-3 text-sm font-medium text-slate-700 min-w-[80px]">
                                                             {calculatedGlm}
                                                         </td>
                                                        <td className="border p-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemovePiece(originalIndex)}
                                                                className="p-1 text-red-500 hover:text-red-700 transition-colors"
                                                            >
                                                                <Trash2 className="h-5 w-5 mx-auto" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        {pieces.length > 0 && (
                                            <tfoot className="bg-slate-50 border-t font-semibold">
                                                <tr>
                                                    <td colSpan={7} className="border p-3 text-right text-sm text-slate-700 font-bold">Total:</td>
                                                    <td className="border p-3 text-right text-sm font-extrabold text-blue-700 bg-blue-50/30">
                                                        {totalReceiveMeters.toFixed(2)}
                                                    </td>
                                                    <td colSpan={4} className="border p-3"></td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4 mt-6">
                        <Button
                            type="button"
                            onClick={() => navigate("/transaction/brushing-receive-details")}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary text-white flex items-center gap-2"
                        >
                            <Save className="h-5 w-5" />
                            {editId ? "Update Receive" : "Save Receive"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
